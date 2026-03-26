import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/src/redux/hooks';
import { sendMessageToGemini, ChatMessage, UserContext } from '@/src/services/gemini';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Quick Prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS: { label: string; icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'restaurant-outline', label: 'What to eat today?',  text: 'What should I eat today based on my goal?' },
  { icon: 'barbell-outline',    label: 'Suggest a workout',   text: 'Suggest a workout plan for today.' },
  { icon: 'analytics-outline',  label: 'Am I on track?',      text: 'Based on my profile, am I on track with my goal?' },
  { icon: 'flame-outline',      label: 'How many calories?',  text: 'How many calories should I eat per day?' },
  { icon: 'nutrition-outline',  label: 'High protein meal',   text: 'Give me a high protein meal idea.' },
  { icon: 'sunny-outline',      label: 'Motivate me',         text: 'Give me some motivation to stay on track today!' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// ─── Sub Components ───────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <View style={styles.aiBubbleWrapper}>
    <View style={styles.aiAvatar}>
      <Ionicons name="sparkles" size={14} color={Colors.white} />
    </View>
    <View style={[styles.aiBubble, styles.typingBubble]}>
      <View style={styles.dotsRow}>
        <TypingDot delay={0} />
        <TypingDot delay={200} />
        <TypingDot delay={400} />
      </View>
    </View>
  </View>
);

const TypingDot = ({ delay }: { delay: number }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 600);
    const timeout = setTimeout(() => {}, delay);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <View style={[styles.dot, { opacity: visible ? 1 : 0.2 }]} />
  );
};

const UserBubble = ({ message }: { message: ChatMessage }) => (
  <View style={styles.userBubbleWrapper}>
    <View style={styles.userBubble}>
      <Text style={styles.userBubbleText}>{message.text}</Text>
    </View>
    <Text style={styles.bubbleTime}>{formatTime(message.timestamp)}</Text>
  </View>
);

// ─── AI Bubble — with saved indicator ────────────────────────────────────────

const AIBubble = ({
  message,
  isSaved,
  onLongPress,
}: {
  message: ChatMessage;
  isSaved: boolean;
  onLongPress: () => void;
}) => (
  <View style={styles.aiBubbleWrapper}>
    <View style={styles.aiAvatar}>
      <Ionicons name="sparkles" size={14} color={Colors.white} />
    </View>
    <View style={styles.aiContent}>
      <TouchableOpacity
        style={[styles.aiBubble, isSaved && styles.aiBubbleSaved]}
        onLongPress={onLongPress}
        activeOpacity={0.85}
        delayLongPress={500}
      >
        <Text style={styles.aiBubbleText}>{message.text}</Text>

        {/* ── Saved indicator inside bubble ── */}
        {isSaved && (
          <View style={styles.savedTag}>
            <Ionicons name="bookmark" size={10} color={Colors.primary} />
            <Text style={styles.savedTagText}>Saved</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.bubbleFooter}>
        <Text style={styles.bubbleTime}>{formatTime(message.timestamp)}</Text>
        {/* Saved bookmark icon below bubble */}
        {isSaved && (
          <View style={styles.savedBadge}>
            <Ionicons name="bookmark" size={11} color={Colors.primary} />
            <Text style={styles.savedBadgeText}>Saved to Favorites</Text>
          </View>
        )}
      </View>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AIChatScreen() {
  const userProfile = useAppSelector(state => state.user.profile);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'ai',
      text: `Hey ${userProfile?.name ?? 'there'}! I'm your AI Coach. Ask me anything about diet, fitness, calories, workouts, or staying on track with your goals. I'm here to help!`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText]           = useState('');
  const [isTyping, setIsTyping]             = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [savedIds, setSavedIds]             = useState<Set<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  // ─── Build user context from Redux ──────────────────────────────────────────

  const getUserContext = (): UserContext => ({
    name:               userProfile?.name ?? 'User',
    weight:             userProfile?.weight ?? 0,
    target_weight:      userProfile?.target_weight ?? 0,
    bmi:                userProfile?.bmi ?? 0,
    gender:             userProfile?.gender ?? '',
    dob:                userProfile?.dob ?? '',
    height:             userProfile?.height ?? 0,
    height_unit:        userProfile?.height_unit ?? 'cm',
    medical_conditions: userProfile?.medical_conditions ?? [],
  });

  // ─── Send Message ────────────────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
    const messageText = (text ?? inputText).trim();
    if (!messageText || isTyping) return;

    setInputText('');
    setShowQuickPrompts(false);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const history = messages.filter(m => !(m.role === 'ai' && messages.indexOf(m) === 0));
      const reply   = await sendMessageToGemini(messageText, history, getUserContext());
      setMessages(prev => [...prev, { id: generateId(), role: 'ai', text: reply, timestamp: new Date() }]);
    } catch (e) {
      console.log('❌ Gemini error:', e);
      setMessages(prev => [...prev, {
        id: generateId(), role: 'ai', timestamp: new Date(),
        text: "Sorry, I couldn't connect right now. Please check your internet and try again.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Long Press → Save ───────────────────────────────────────────────────────

  const handleLongPress = (message: ChatMessage) => {
    const alreadySaved = savedIds.has(message.id);

    Alert.alert(
      alreadySaved ? 'Already Saved' : 'Save Response',
      alreadySaved
        ? 'This response is already saved to your Favorites. Remove it?'
        : 'Save this AI response to your Favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: alreadySaved ? 'Remove' : 'Save',
          style: alreadySaved ? 'destructive' : 'default',
          onPress: () => {
            setSavedIds(prev => {
              const next = new Set(prev);
              if (alreadySaved) {
                next.delete(message.id);
              } else {
                next.add(message.id);
              }
              return next;
            });
          },
        },
      ]
    );
  };

  // ─── Clear Chat ──────────────────────────────────────────────────────────────

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Start a fresh conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setMessages([{
            id: generateId(),
            role: 'ai',
            text: `Hey ${userProfile?.name ?? 'there'}! I'm your AI Coach. Ask me anything about diet, fitness, calories, workouts, or staying on track!`,
            timestamp: new Date(),
          }]);
          setShowQuickPrompts(true);
          setSavedIds(new Set());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSub}>
              {isTyping ? 'Typing...' : 'Online · Ask me anything'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn} activeOpacity={0.7}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: 85 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {messages.map(msg =>
            msg.role === 'user' ? (
              <UserBubble key={msg.id} message={msg} />
            ) : (
              <AIBubble
                key={msg.id}
                message={msg}
                isSaved={savedIds.has(msg.id)}
                onLongPress={() => handleLongPress(msg)}
              />
            )
          )}

          {isTyping && <TypingIndicator />}

          {/* ── Quick Prompts ── */}
          {showQuickPrompts && !isTyping && (
            <View style={styles.quickPromptsSection}>
              <Text style={styles.quickPromptsTitle}>Quick questions</Text>
              <View style={styles.quickPromptsGrid}>
                {QUICK_PROMPTS.map((qp, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickChip}
                    onPress={() => handleSend(qp.text)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={qp.icon} size={13} color={Colors.primary} />
                    <Text style={styles.quickChipText}>{qp.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your AI Coach..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            activeOpacity={0.85}
            disabled={!inputText.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles — only saved-related styles added, nothing else changed ───────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
  headerSub:   { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 1 },
  clearBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  clearBtnText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },

  messagesList:    { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },

  userBubbleWrapper: { alignItems: 'flex-end', marginBottom: 4 },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    maxWidth: '80%',
  },
  userBubbleText: { fontSize: Fonts.sizes.md, color: Colors.white, lineHeight: 22 },

  aiBubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 4 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  aiAvatarText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  aiContent:    { flex: 1, alignItems: 'flex-start' },
  aiBubble: {
    backgroundColor: Colors.white,
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    maxWidth: '85%', borderWidth: 1, borderColor: Colors.border,
  },

  // ── Saved state — bubble gets a green left border tint ──
  aiBubbleSaved: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.primaryMuted,
  },

  // ── Saved tag inside bubble (bottom-right) ──
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  savedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },

  aiBubbleText: { fontSize: Fonts.sizes.md, color: Colors.textDark, lineHeight: 22 },

  // ── Footer row below bubble: time + saved badge ──
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    marginHorizontal: 4,
  },
  bubbleTime: { fontSize: 11, color: Colors.textMuted },

  // ── Saved badge below bubble ──
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  savedBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  typingBubble: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.md },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  quickPromptsSection: { marginTop: Spacing.md },
  quickPromptsTitle: {
    fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textMuted,
    marginBottom: Spacing.sm, textAlign: 'center',
  },
  quickPromptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.white, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  quickChipText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Spacing.md + 20,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: Colors.white, borderRadius: 22,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: Fonts.sizes.md, color: Colors.textDark,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnIcon: { fontSize: 20, color: Colors.white, fontWeight: '700', lineHeight: 24 },
});