import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { MessageBubbleIcon, HeartIcon } from '@/components/SVGMotifs';

type Tone = 'romantic' | 'playful' | 'encouraging' | 'heartfelt' | 'flirty';
type Occasion = 'just-because' | 'morning' | 'goodnight' | 'apology' | 'achievement' | 'anniversary' | 'custom';

interface SavedMessage {
  id: string;
  text: string;
  tone: Tone;
  occasion: Occasion;
  createdAt: string;
  favorite: boolean;
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'romantic', label: 'Romantic', emoji: '🌹' },
  { value: 'playful', label: 'Playful', emoji: '😄' },
  { value: 'encouraging', label: 'Encouraging', emoji: '💪' },
  { value: 'heartfelt', label: 'Heartfelt', emoji: '💛' },
  { value: 'flirty', label: 'Flirty', emoji: '😘' },
];

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'just-because', label: 'Just Because' },
  { value: 'morning', label: 'Good Morning' },
  { value: 'goodnight', label: 'Good Night' },
  { value: 'apology', label: "I'm Sorry" },
  { value: 'achievement', label: 'Proud of You' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'custom', label: 'Custom' },
];

const SAMPLE_MESSAGES: Record<Tone, string[]> = {
  romantic: [
    "Every day with you feels like the universe conspired to give me the greatest gift — you. I love you more than words can hold.",
    "I keep falling for you, over and over, like it's the first time. You're the best part of every single day.",
    "Loving you is the easiest thing I've ever done, and the most important.",
  ],
  playful: [
    "Warning: being around you has serious side effects, including uncontrollable smiling and random bursts of happiness. I'm completely addicted.",
    "If love is a game, I'm winning — because I have you on my team. Lucky me! 🎉",
    "You know that song stuck in my head all day? It's basically just your name on repeat. Don't tell anyone.",
  ],
  encouraging: [
    "You handle more than most people ever realize, and you do it with so much grace. I see you, and I'm so proud of you.",
    "Whatever today throws at you — you've got this. And you've got me in your corner, always.",
    "I want you to know that your strength inspires me every single day. You're extraordinary.",
  ],
  heartfelt: [
    "I don't say this enough: thank you for everything you bring to my life. You make me want to be better.",
    "There's a version of every good memory I have, and you're in every single one of them.",
    "I'm grateful for you in ways I can't always put into words. Just know my heart is full because of you.",
  ],
  flirty: [
    "Is it weird that I still get butterflies when I see your name on my phone? Because same. Every time.",
    "Just so you know, you're dangerously attractive and it's incredibly distracting. Thought you should be aware.",
    "I had a whole day planned, but honestly I'd rather just spend it with you. My priorities are very clear.",
  ],
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getLocalMessage(tone: Tone, _occasion: Occasion): string {
  const msgs = SAMPLE_MESSAGES[tone];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export default function MessagesScreen() {
  const [selectedTone, setSelectedTone] = useState<Tone>('romantic');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('just-because');
  const [customContext, setCustomContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [savedRaw, nameRaw, keyRaw] = await Promise.all([
        AsyncStorage.getItem('saved_messages'),
        AsyncStorage.getItem('partner_name'),
        AsyncStorage.getItem('claude_api_key'),
      ]);
      if (savedRaw) setSavedMessages(JSON.parse(savedRaw));
      if (nameRaw) setPartnerName(nameRaw);
      if (keyRaw) setApiKey(keyRaw);
    } catch {}
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedMessage('');
    try {
      if (apiKey) {
        const prompt = buildPrompt(selectedTone, selectedOccasion, partnerName, customContext);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text ?? getLocalMessage(selectedTone, selectedOccasion);
          setGeneratedMessage(text.trim());
        } else {
          setGeneratedMessage(getLocalMessage(selectedTone, selectedOccasion));
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
        setGeneratedMessage(getLocalMessage(selectedTone, selectedOccasion));
      }
    } catch {
      setGeneratedMessage(getLocalMessage(selectedTone, selectedOccasion));
    } finally {
      setIsGenerating(false);
    }
  }

  function buildPrompt(tone: Tone, occasion: Occasion, name: string, context: string): string {
    const toneDesc = TONES.find((t) => t.value === tone)?.label ?? tone;
    const occasionDesc = OCCASIONS.find((o) => o.value === occasion)?.label ?? occasion;
    return [
      `Write a single ${toneDesc.toLowerCase()} message for a man to send to his partner.`,
      name ? `Her name is ${name}.` : '',
      `Occasion: ${occasionDesc}.`,
      context ? `Extra context: ${context}.` : '',
      'The message should feel genuine, personal, and not overly long — 2-4 sentences maximum.',
      'Return only the message text, no quotes or explanation.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  async function handleSave() {
    if (!generatedMessage) return;
    const newMsg: SavedMessage = {
      id: generateId(),
      text: generatedMessage,
      tone: selectedTone,
      occasion: selectedOccasion,
      createdAt: new Date().toISOString(),
      favorite: false,
    };
    const updated = [newMsg, ...savedMessages];
    setSavedMessages(updated);
    await AsyncStorage.setItem('saved_messages', JSON.stringify(updated));
    Alert.alert('Saved!', 'Message saved to your collection.');
  }

  async function handleShare() {
    if (!generatedMessage) return;
    await Share.share({ message: generatedMessage });
  }

  async function toggleFavorite(id: string) {
    const updated = savedMessages.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m));
    setSavedMessages(updated);
    await AsyncStorage.setItem('saved_messages', JSON.stringify(updated));
  }

  async function deleteMessage(id: string) {
    const updated = savedMessages.filter((m) => m.id !== id);
    setSavedMessages(updated);
    await AsyncStorage.setItem('saved_messages', JSON.stringify(updated));
  }

  async function saveSettings() {
    await AsyncStorage.setItem('claude_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setShowSettings(false);
  }

  const favorites = savedMessages.filter((m) => m.favorite);
  const recent = savedMessages.filter((m) => !m.favorite).slice(0, 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenLabel}>AI-POWERED</Text>
          <Text style={styles.screenTitle}>Message Ideas</Text>
        </View>
        <TouchableOpacity
          style={styles.savedButton}
          onPress={() => setShowSaved(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.savedButtonText}>Saved {savedMessages.length > 0 ? `(${savedMessages.length})` : ''}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tone Selector */}
        <Text style={styles.sectionLabel}>Tone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toneScroll}>
          {TONES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.toneChip, selectedTone === t.value && styles.toneChipActive]}
              onPress={() => setSelectedTone(t.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.toneEmoji}>{t.emoji}</Text>
              <Text style={[styles.toneLabel, selectedTone === t.value && styles.toneLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Occasion Selector */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Occasion</Text>
        <View style={styles.occasionGrid}>
          {OCCASIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.occasionPill, selectedOccasion === o.value && styles.occasionPillActive]}
              onPress={() => setSelectedOccasion(o.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.occasionText, selectedOccasion === o.value && styles.occasionTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Context Input */}
        {selectedOccasion === 'custom' && (
          <View style={{ marginTop: Spacing.md }}>
            <Text style={styles.sectionLabel}>Tell me more</Text>
            <TextInput
              style={styles.contextInput}
              placeholder="e.g. She just got a promotion at work..."
              placeholderTextColor={Colors.text.muted}
              multiline
              numberOfLines={3}
              value={customContext}
              onChangeText={setCustomContext}
            />
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={Colors.navy.dark} />
          ) : (
            <Text style={styles.generateButtonText}>
              {generatedMessage ? 'Generate Another' : 'Generate Message'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Generated Message */}
        {generatedMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{generatedMessage}</Text>
            <View style={styles.messageActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                <HeartIcon size={18} color={Colors.rose.DEFAULT} filled={false} />
                <Text style={styles.actionBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <MessageBubbleIcon size={18} color={Colors.gold.DEFAULT} />
                <Text style={styles.actionBtnText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleGenerate}>
                <Text style={styles.refreshIcon}>↻</Text>
                <Text style={styles.actionBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* API key prompt */}
        {!apiKey && (
          <TouchableOpacity
            style={styles.apiPrompt}
            onPress={() => { setTempApiKey(''); setShowSettings(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.apiPromptTitle}>Unlock AI-Powered Messages</Text>
            <Text style={styles.apiPromptText}>
              Add your Claude API key for truly personalized, unique messages every time.
            </Text>
            <Text style={styles.apiPromptCta}>Add API Key →</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Saved Messages Modal */}
      <Modal visible={showSaved} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSaved(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSaved(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Saved Messages</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
            {savedMessages.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageBubbleIcon size={48} color={Colors.gold.dark} />
                <Text style={styles.emptyText}>No saved messages yet</Text>
              </View>
            ) : (
              <>
                {favorites.length > 0 && (
                  <>
                    <Text style={styles.savedSection}>Favorites</Text>
                    {favorites.map((m) => <SavedCard key={m.id} message={m} onToggleFav={toggleFavorite} onDelete={deleteMessage} onShare={handleShare} />)}
                  </>
                )}
                {recent.length > 0 && (
                  <>
                    <Text style={styles.savedSection}>Recent</Text>
                    {recent.map((m) => <SavedCard key={m.id} message={m} onToggleFav={toggleFavorite} onDelete={deleteMessage} onShare={handleShare} />)}
                  </>
                )}
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* API Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSettings(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>API Settings</Text>
            <TouchableOpacity onPress={saveSettings}>
              <Text style={[styles.modalClose, { color: Colors.gold.DEFAULT }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.lg }}>
            <Text style={styles.sectionLabel}>Claude API Key</Text>
            <TextInput
              style={styles.contextInput}
              placeholder="sk-ant-..."
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              value={tempApiKey}
              onChangeText={setTempApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.apiHint}>
              Your API key is stored locally on your device and never shared. Get a key at console.anthropic.com
            </Text>
            {apiKey ? (
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: Colors.rose.dark, marginTop: Spacing.lg }]}
                onPress={async () => {
                  await AsyncStorage.removeItem('claude_api_key');
                  setApiKey('');
                  setTempApiKey('');
                  setShowSettings(false);
                }}
              >
                <Text style={styles.generateButtonText}>Remove API Key</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SavedCard({
  message,
  onToggleFav,
  onDelete,
  onShare,
}: {
  message: SavedMessage;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: () => void;
}) {
  const tone = TONES.find((t) => t.value === message.tone);
  return (
    <View style={styles.savedCard}>
      <Text style={styles.savedText}>{message.text}</Text>
      <View style={styles.savedMeta}>
        <Text style={styles.savedTone}>{tone?.emoji} {tone?.label}</Text>
        <View style={styles.savedActions}>
          <TouchableOpacity onPress={() => onToggleFav(message.id)}>
            <HeartIcon size={18} color={Colors.rose.DEFAULT} filled={message.favorite} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={{ marginLeft: 12 }}>
            <MessageBubbleIcon size={18} color={Colors.gold.DEFAULT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(message.id)} style={{ marginLeft: 12 }}>
            <Text style={{ color: Colors.text.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy.DEFAULT },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  screenLabel: { fontFamily: Typography.body, fontSize: 11, color: Colors.text.muted, letterSpacing: 1.5, marginBottom: 2 },
  screenTitle: { fontFamily: Typography.display, fontSize: 26, color: Colors.white },
  savedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}44`,
  },
  savedButtonText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.gold.DEFAULT },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  sectionLabel: { fontFamily: Typography.semibold, fontSize: 13, color: Colors.text.secondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm },
  toneScroll: { marginLeft: -Spacing.md, paddingLeft: Spacing.md, marginBottom: Spacing.sm },
  toneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
    marginRight: Spacing.sm,
    backgroundColor: Colors.navy.card,
  },
  toneChipActive: { borderColor: Colors.gold.DEFAULT, backgroundColor: `${Colors.gold.DEFAULT}18` },
  toneEmoji: { fontSize: 16 },
  toneLabel: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.secondary },
  toneLabelActive: { color: Colors.gold.DEFAULT },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  occasionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
    backgroundColor: Colors.navy.card,
  },
  occasionPillActive: { borderColor: Colors.rose.DEFAULT, backgroundColor: `${Colors.rose.DEFAULT}18` },
  occasionText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary },
  occasionTextActive: { color: Colors.rose.DEFAULT },
  contextInput: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}22`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.white,
    height: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.DEFAULT,
    alignItems: 'center',
    ...Shadow.glow,
  },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { fontFamily: Typography.bold, fontSize: 16, color: Colors.navy.dark },
  messageCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.rose.DEFAULT}22`,
    ...Shadow.card,
  },
  messageText: {
    fontFamily: Typography.displayItalic ?? Typography.body,
    fontSize: 17,
    color: Colors.white,
    lineHeight: 26,
    textAlign: 'center',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${Colors.white}10`,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionBtnText: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.muted },
  refreshIcon: { fontSize: 18, color: Colors.gold.DEFAULT },
  apiPrompt: {
    marginTop: Spacing.lg,
    backgroundColor: `${Colors.gold.DEFAULT}12`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}30`,
    gap: Spacing.sm,
  },
  apiPromptTitle: { fontFamily: Typography.semibold, fontSize: 15, color: Colors.gold.DEFAULT },
  apiPromptText: { fontFamily: Typography.body, fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  apiPromptCta: { fontFamily: Typography.semibold, fontSize: 13, color: Colors.gold.DEFAULT },
  apiHint: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.muted, marginTop: Spacing.sm, lineHeight: 18 },
  bottomSpacer: { height: 100 },
  modalSafe: { flex: 1, backgroundColor: Colors.navy.DEFAULT },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.gold.DEFAULT}22`,
  },
  modalClose: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.secondary },
  modalTitle: { fontFamily: Typography.semibold, fontSize: 17, color: Colors.white },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { fontFamily: Typography.medium, fontSize: 15, color: Colors.text.secondary },
  savedSection: {
    fontFamily: Typography.semibold,
    fontSize: 12,
    color: Colors.text.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  savedCard: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.white}10`,
  },
  savedText: { fontFamily: Typography.body, fontSize: 14, color: Colors.white, lineHeight: 22, marginBottom: Spacing.sm },
  savedMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedTone: { fontFamily: Typography.medium, fontSize: 12, color: Colors.text.muted },
  savedActions: { flexDirection: 'row', alignItems: 'center' },
});
