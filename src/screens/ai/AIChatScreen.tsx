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
import { useAppSelector } from '@/src/redux/hooks';
import { sendMessageToGemini, ChatMessage, UserContext } from '@/src/services/gemini';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Quick Prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: '🍽️ What to eat today?',       text: 'What should I eat today based on my goal?' },
  { label: '💪 Suggest a workout',          text: 'Suggest a workout plan for today.' },
  { label: '📊 Am I on track?',             text: 'Based on my profile, am I on track with my goal?' },
  { label: '🔥 How many calories?',         text: 'How many calories should I eat per day?' },
  { label: '🥗 High protein meal idea',     text: 'Give me a high protein meal idea.' },
  { label: '⚡ Motivate me',                text: 'Give me some motivation to stay on track today!' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// ─── Sub Components ───────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <View style={styles.aiBubbleWrapper}>
    <View style={styles.aiAvatar}>
      <Text style={styles.aiAvatarText}>AI</Text>
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

const AIBubble = ({ message, onLongPress }: { message: ChatMessage; onLongPress: () => void }) => (
  <View style={styles.aiBubbleWrapper}>
    <View style={styles.aiAvatar}>
      <Text style={styles.aiAvatarText}>AI</Text>
    </View>
    <View style={styles.aiContent}>
      <TouchableOpacity
        style={styles.aiBubble}
        onLongPress={onLongPress}
        activeOpacity={0.85}
        delayLongPress={500}
      >
        <Text style={styles.aiBubbleText}>{message.text}</Text>
      </TouchableOpacity>
      <Text style={styles.bubbleTime}>{formatTime(message.timestamp)}</Text>
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
      text: `Hey ${userProfile?.name ?? 'there'}! 👋 I'm your AI Coach. Ask me anything about diet, fitness, calories, workouts, or staying on track with your goals. I'm here to help! 💪`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

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

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Filter out the initial greeting from history sent to Gemini
      const history = messages.filter(m => !(m.role === 'ai' && messages.indexOf(m) === 0));
      const reply = await sendMessageToGemini(messageText, history, getUserContext());

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        text: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.log('❌ Gemini error:', e);
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        text: "Sorry, I couldn't connect right now. Please check your internet and try again. 🙏",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Long Press → Save ───────────────────────────────────────────────────────

  const handleLongPress = (message: ChatMessage) => {
    Alert.alert(
      'Save Response',
      'Save this AI response to your Favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => Alert.alert('Saved!', 'Added to your Favorites.') },
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
            text: `Hey ${userProfile?.name ?? 'there'}! 👋 I'm your AI Coach. Ask me anything about diet, fitness, calories, workouts, or staying on track! 💪`,
            timestamp: new Date(),
          }]);
          setShowQuickPrompts(true);
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
            <Text style={styles.headerAvatarText}>AI</Text>
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
              <Text style={styles.sendBtnIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  // Header
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
  headerSub: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 1 },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },

  // Messages
  messagesList: { flex: 1 },
  messagesContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },

  // User Bubble
  userBubbleWrapper: { alignItems: 'flex-end', marginBottom: 4 },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '80%',
  },
  userBubbleText: { fontSize: Fonts.sizes.md, color: Colors.white, lineHeight: 22 },

  // AI Bubble
  aiBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiAvatarText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  aiContent: { flex: 1, alignItems: 'flex-start' },
  aiBubble: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiBubbleText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    lineHeight: 22,
  },

  bubbleTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    marginHorizontal: 4,
  },

  // Typing Indicator
  typingBubble: {
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Quick Prompts
  quickPromptsSection: { marginTop: Spacing.md },
  quickPromptsTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickChip: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  quickChipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.md + 20,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnIcon: { fontSize: 20, color: Colors.white, fontWeight: '700', lineHeight: 24 },
});