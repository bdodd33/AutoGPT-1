import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { GiftIcon, HeartIcon } from '@/components/SVGMotifs';

type GiftCategory = 'jewelry' | 'experiences' | 'pampering' | 'fashion' | 'home' | 'tech' | 'personalized';
type BudgetRange = 'under-25' | '25-50' | '50-100' | '100-200' | '200-plus';
type Occasion = 'birthday' | 'anniversary' | 'just-because' | 'valentines' | 'holiday' | 'custom';

interface GiftSuggestion {
  id: string;
  title: string;
  description: string;
  priceRange: string;
  category: GiftCategory;
  searchQuery: string;
  why: string;
}

interface SavedGift extends GiftSuggestion {
  savedAt: string;
}

const CATEGORIES: { value: GiftCategory; label: string; emoji: string }[] = [
  { value: 'jewelry', label: 'Jewelry', emoji: '💍' },
  { value: 'experiences', label: 'Experiences', emoji: '🌟' },
  { value: 'pampering', label: 'Pampering', emoji: '💆' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'home', label: 'Home', emoji: '🏡' },
  { value: 'tech', label: 'Tech', emoji: '📱' },
  { value: 'personalized', label: 'Personalized', emoji: '🎨' },
];

const BUDGETS: { value: BudgetRange; label: string }[] = [
  { value: 'under-25', label: 'Under $25' },
  { value: '25-50', label: '$25 – $50' },
  { value: '50-100', label: '$50 – $100' },
  { value: '100-200', label: '$100 – $200' },
  { value: '200-plus', label: '$200+' },
];

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'valentines', label: "Valentine's" },
  { value: 'just-because', label: 'Just Because' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'custom', label: 'Other' },
];

const SAMPLE_GIFTS: GiftSuggestion[] = [
  {
    id: '1',
    title: 'Personalized Name Necklace',
    description: 'A delicate gold-plated necklace with her name in elegant script. Timeless and deeply personal.',
    priceRange: '$35–$80',
    category: 'jewelry',
    searchQuery: 'personalized name necklace gold',
    why: 'Shows you thought specifically about her — not just a generic gift.',
  },
  {
    id: '2',
    title: 'Luxury Spa Gift Set',
    description: 'Premium bath bombs, body butter, and a silk sleep mask. The at-home spa experience she deserves.',
    priceRange: '$45–$90',
    category: 'pampering',
    searchQuery: 'luxury spa gift set for women bath',
    why: 'Tells her to relax and be pampered — and that you want that for her.',
  },
  {
    id: '3',
    title: 'Custom Star Map Print',
    description: 'A beautifully framed print of the night sky on a date that matters to you both.',
    priceRange: '$40–$100',
    category: 'personalized',
    searchQuery: 'custom star map night sky print personalized',
    why: 'Captures a moment in time — deeply romantic and utterly unique.',
  },
  {
    id: '4',
    title: 'Cooking Class Experience',
    description: 'A hands-on cooking class for two — date night and learning something new together.',
    priceRange: '$80–$150',
    category: 'experiences',
    searchQuery: 'couples cooking class experience gift',
    why: 'Creates a memory, not just a possession. Experiences outlast things.',
  },
  {
    id: '5',
    title: 'Silk Pillowcase Set',
    description: "Premium mulberry silk pillowcases. Incredible for hair and skin — she'll notice the difference.",
    priceRange: '$50–$120',
    category: 'home',
    searchQuery: 'mulberry silk pillowcase luxury gift',
    why: "Practical luxury she'll use every night and think of you.",
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function buildAmazonSearchUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=hubbyhelper-20`;
}

export default function GiftsScreen() {
  const [selectedCategories, setSelectedCategories] = useState<GiftCategory[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange>('50-100');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('birthday');
  const [partnerInterests, setPartnerInterests] = useState('');
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedGifts, setSavedGifts] = useState<SavedGift[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [savedRaw, nameRaw, keyRaw] = await Promise.all([
        AsyncStorage.getItem('saved_gifts'),
        AsyncStorage.getItem('partner_name'),
        AsyncStorage.getItem('claude_api_key'),
      ]);
      if (savedRaw) setSavedGifts(JSON.parse(savedRaw));
      if (nameRaw) setPartnerName(nameRaw);
      if (keyRaw) setApiKey(keyRaw);
    } catch {}
  }

  function toggleCategory(cat: GiftCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSearch() {
    setIsSearching(true);
    setSuggestions([]);
    try {
      if (apiKey) {
        const prompt = buildGiftPrompt();
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text ?? '';
          const parsed = parseGiftResponse(text);
          if (parsed.length > 0) {
            setSuggestions(parsed);
            setIsSearching(false);
            return;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 1200));
      const filtered = filterSampleGifts();
      setSuggestions(filtered);
    } catch {
      setSuggestions(SAMPLE_GIFTS.slice(0, 4));
    } finally {
      setIsSearching(false);
    }
  }

  function filterSampleGifts(): GiftSuggestion[] {
    let filtered = SAMPLE_GIFTS;
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((g) => selectedCategories.includes(g.category));
    }
    return filtered.length > 0 ? filtered : SAMPLE_GIFTS.slice(0, 4);
  }

  function buildGiftPrompt(): string {
    const cats = selectedCategories.map((c) => CATEGORIES.find((x) => x.value === c)?.label).join(', ');
    const budget = BUDGETS.find((b) => b.value === selectedBudget)?.label;
    const occasion = OCCASIONS.find((o) => o.value === selectedOccasion)?.label;
    return [
      `Suggest 4 specific gift ideas for a man to give his partner.`,
      partnerName ? `Her name is ${partnerName}.` : '',
      `Occasion: ${occasion}.`,
      `Budget: ${budget}.`,
      cats ? `Preferred categories: ${cats}.` : '',
      partnerInterests ? `Her interests: ${partnerInterests}.` : '',
      '',
      'Return ONLY a JSON array with this exact structure (no other text):',
      '[{"title":"...","description":"...","priceRange":"...","category":"...","searchQuery":"...","why":"..."}]',
      'The searchQuery should be good Amazon search terms. The why explains why she will love it.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  function parseGiftResponse(text: string): GiftSuggestion[] {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return [];
      const parsed = JSON.parse(match[0]);
      return parsed.map((g: Record<string, string>, i: number) => ({
        id: generateId() + i,
        title: g.title ?? '',
        description: g.description ?? '',
        priceRange: g.priceRange ?? '',
        category: (g.category as GiftCategory) ?? 'personalized',
        searchQuery: g.searchQuery ?? g.title ?? '',
        why: g.why ?? '',
      }));
    } catch {
      return [];
    }
  }

  async function saveGift(gift: GiftSuggestion) {
    const saved: SavedGift = { ...gift, id: generateId(), savedAt: new Date().toISOString() };
    const updated = [saved, ...savedGifts];
    setSavedGifts(updated);
    await AsyncStorage.setItem('saved_gifts', JSON.stringify(updated));
    Alert.alert('Saved!', `"${gift.title}" added to your gift list.`);
  }

  async function removeGift(id: string) {
    const updated = savedGifts.filter((g) => g.id !== id);
    setSavedGifts(updated);
    await AsyncStorage.setItem('saved_gifts', JSON.stringify(updated));
  }

  function openAmazon(searchQuery: string) {
    Linking.openURL(buildAmazonSearchUrl(searchQuery));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenLabel}>AI-POWERED</Text>
          <Text style={styles.screenTitle}>Gift Finder</Text>
        </View>
        {savedGifts.length > 0 && (
          <TouchableOpacity style={styles.savedButton} onPress={() => setShowSaved(!showSaved)}>
            <Text style={styles.savedButtonText}>
              {showSaved ? 'Find Gifts' : `Saved (${savedGifts.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showSaved ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {savedGifts.map((g) => (
            <GiftCard key={g.id} gift={g} onSave={() => removeGift(g.id)} isSaved onShop={() => openAmazon(g.searchQuery)} />
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Occasion */}
          <Text style={styles.sectionLabel}>Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {OCCASIONS.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[styles.chip, selectedOccasion === o.value && styles.chipActive]}
                onPress={() => setSelectedOccasion(o.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedOccasion === o.value && styles.chipTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Budget */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Budget</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {BUDGETS.map((b) => (
              <TouchableOpacity
                key={b.value}
                style={[styles.chip, selectedBudget === b.value && styles.chipGoldActive]}
                onPress={() => setSelectedBudget(b.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedBudget === b.value && styles.chipTextGold]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Categories */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Categories (optional)</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.catChip, selectedCategories.includes(c.value) && styles.catChipActive]}
                onPress={() => toggleCategory(c.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, selectedCategories.includes(c.value) && styles.catLabelActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interests */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
            {partnerName ? `${partnerName}'s Interests` : 'Her Interests'} (optional)
          </Text>
          <TextInput
            style={styles.interestsInput}
            placeholder="e.g. yoga, cooking, reading, travel, art..."
            placeholderTextColor={Colors.text.muted}
            value={partnerInterests}
            onChangeText={setPartnerInterests}
          />

          {/* Search Button */}
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            activeOpacity={0.85}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color={Colors.navy.dark} />
            ) : (
              <Text style={styles.searchButtonText}>Find Perfect Gifts</Text>
            )}
          </TouchableOpacity>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
                {suggestions.length} Gift Ideas
              </Text>
              {suggestions.map((g) => (
                <GiftCard
                  key={g.id}
                  gift={g}
                  onSave={() => saveGift(g)}
                  isSaved={false}
                  onShop={() => openAmazon(g.searchQuery)}
                />
              ))}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function GiftCard({
  gift,
  onSave,
  isSaved,
  onShop,
}: {
  gift: GiftSuggestion;
  onSave: () => void;
  isSaved: boolean;
  onShop: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === gift.category);
  return (
    <View style={styles.giftCard}>
      <View style={styles.giftHeader}>
        <View style={styles.giftEmojiBg}>
          <Text style={styles.giftEmoji}>{cat?.emoji ?? '🎁'}</Text>
        </View>
        <View style={styles.giftTitleBlock}>
          <Text style={styles.giftTitle}>{gift.title}</Text>
          <Text style={styles.giftPrice}>{gift.priceRange}</Text>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
          <HeartIcon size={20} color={Colors.rose.DEFAULT} filled={isSaved} />
        </TouchableOpacity>
      </View>
      <Text style={styles.giftDesc}>{gift.description}</Text>
      {gift.why ? (
        <View style={styles.whyBlock}>
          <Text style={styles.whyLabel}>Why she'll love it:</Text>
          <Text style={styles.whyText}>{gift.why}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={styles.shopButton} onPress={onShop} activeOpacity={0.85}>
        <GiftIcon size={16} color={Colors.navy.dark} />
        <Text style={styles.shopButtonText}>Shop on Amazon</Text>
      </TouchableOpacity>
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
  sectionLabel: {
    fontFamily: Typography.semibold,
    fontSize: 13,
    color: Colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  hScroll: { marginLeft: -Spacing.md, paddingLeft: Spacing.md, marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
    marginRight: Spacing.sm,
    backgroundColor: Colors.navy.card,
  },
  chipActive: { borderColor: Colors.rose.DEFAULT, backgroundColor: `${Colors.rose.DEFAULT}18` },
  chipGoldActive: { borderColor: Colors.gold.DEFAULT, backgroundColor: `${Colors.gold.DEFAULT}18` },
  chipText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { color: Colors.rose.DEFAULT },
  chipTextGold: { color: Colors.gold.DEFAULT },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
    backgroundColor: Colors.navy.card,
  },
  catChipActive: { borderColor: Colors.gold.DEFAULT, backgroundColor: `${Colors.gold.DEFAULT}18` },
  catEmoji: { fontSize: 16 },
  catLabel: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary },
  catLabelActive: { color: Colors.gold.DEFAULT },
  interestsInput: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}22`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.white,
  },
  searchButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.DEFAULT,
    alignItems: 'center',
    ...Shadow.glow,
  },
  searchButtonDisabled: { opacity: 0.7 },
  searchButtonText: { fontFamily: Typography.bold, fontSize: 16, color: Colors.navy.dark },
  giftCard: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}18`,
    ...Shadow.card,
  },
  giftHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  giftEmojiBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.gold.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: { fontSize: 22 },
  giftTitleBlock: { flex: 1 },
  giftTitle: { fontFamily: Typography.semibold, fontSize: 15, color: Colors.white, marginBottom: 2 },
  giftPrice: { fontFamily: Typography.medium, fontSize: 13, color: Colors.gold.DEFAULT },
  saveBtn: { padding: 6 },
  giftDesc: { fontFamily: Typography.body, fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginBottom: Spacing.sm },
  whyBlock: {
    backgroundColor: `${Colors.rose.DEFAULT}10`,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.rose.DEFAULT,
  },
  whyLabel: { fontFamily: Typography.semibold, fontSize: 11, color: Colors.rose.DEFAULT, marginBottom: 2 },
  whyText: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.secondary, lineHeight: 17 },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.DEFAULT,
  },
  shopButtonText: { fontFamily: Typography.semibold, fontSize: 14, color: Colors.navy.dark },
  bottomSpacer: { height: 100 },
});
