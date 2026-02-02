/**
 * Search Screen
 * Animated search interface with debounced results and related suggestions
 * Uses TMDB search for real movie data
 */
 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    Dimensions,
    FlatList,
    Keyboard,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Movie } from '../../src/api/tmdb';
import { MovieCard, MovieCardSkeleton } from '../../src/components';
import { COLORS, FONT_SIZES, SPACING } from '../../src/constants/theme';
import { useHomeData, useSearchMovies } from '../../src/hooks/useMovies';
import { transcribeAudio, isWhisperConfigured } from '../../src/utils/whisper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export default function SearchScreen() {
    const {
        data: results = [],
        loading,
        query = '',
        search,
    } = useSearchMovies();
 
    const { data: homeData } = useHomeData();
    const inputRef = useRef<TextInput>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceSupported, setIsVoiceSupported] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [manualText, setManualText] = useState(''); // Track manual text input

    // Setup audio recording and permissions on mount
    useEffect(() => {
        const setupAudio = async () => {
            try {
                // Set audio mode for recording
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                
                // Check if Whisper is configured
                const configured = isWhisperConfigured();
                setIsVoiceSupported(configured);

                if (!configured) {
                    console.warn('Whisper API not configured. Voice search disabled.');
                }
            } catch (error) {
                console.warn('Failed to setup audio:', error);
                setIsVoiceSupported(false);
            }
        };

        setupAudio();
    }, []);
 
    // Web SpeechRecognition setup (for web platform)
    useEffect(() => {
        if (Platform.OS !== 'web' || !isVoiceSupported) return;

        if (typeof window === 'undefined') return;
        const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) {
            setIsVoiceSupported(false);
            return;
        }

        const recognition = new SpeechRecognitionImpl();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Web result handler: push transcript into search + input
        recognition.onresult = (event: any) => {
            const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
            if (transcript.trim()) {
                search(transcript);
                syncInputText(transcript);
            }
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        // Store for web platform use
        if (Platform.OS === 'web') {
            (recognitionRef as any).current = recognition;
        }

        return () => {
            recognition.stop?.();
        };
    }, [search, isVoiceSupported]);
 
    // Updates the input text safely (some platforms don't expose setNativeProps)
    const syncInputText = (text: string) => {
        const input = inputRef.current as { setNativeProps?: (args: { text: string }) => void } | null;
        if (input && typeof input.setNativeProps === 'function') {
            input.setNativeProps({ text });
        }
    };
 
    const handleSearch = (text: string) => {
        setManualText(text);
        search(text);
    };
 
    const handleClear = () => {
        setManualText('');
        search('');
        if (typeof inputRef.current?.clear === 'function') {
            inputRef.current.clear();
        }
        Keyboard.dismiss();
    };
 
    const handleSuggestionClick = (title: string) => {
        search(title);
        syncInputText(title);
        Keyboard.dismiss();
    };
 
    const onSearchSubmit = () => {
        Keyboard.dismiss();
    };
 
    // Android-only mic permission before starting audio recording
    const requestAudioPermission = async () => {
        if (Platform.OS !== 'android') return true;
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone permission',
                message: 'We need access to your microphone for voice search.',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    };

    // Mic button toggles recording and transcription
    const handleVoicePress = async () => {
        if (!isVoiceSupported) {
            Alert.alert(
                'Voice search unavailable',
                'OpenAI API is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.'
            );
            return;
        }

        if (Platform.OS === 'web') {
            // Web: Use native SpeechRecognition API
            const rec = (recognitionRef as any).current;
            if (!rec) {
                Alert.alert('Voice search unavailable', 'Your browser does not support speech recognition.');
                return;
            }

            if (isListening) {
                rec?.stop?.();
                setIsListening(false);
                return;
            }

            try {
                rec?.start?.();
                setIsListening(true);
            } catch {
                setIsListening(false);
            }
            return;
        }

        // Native: Use Whisper API with audio recording
        try {
            if (isListening) {
                // Stop recording
                await stopRecording();
            } else {
                // Start recording
                await startRecording();
            }
        } catch (error) {
            console.error('Voice press error:', error);
            setIsListening(false);
            Alert.alert('Error', 'Failed to process voice command');
        }
    };

    // Start audio recording
    const startRecording = async () => {
        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Microphone permission denied', 'Enable microphone access to use voice search.');
                return;
            }

            setIsListening(true);
            const recording = new Audio.Recording();
            recordingRef.current = recording;

            await recording.prepareToRecordAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            await recording.startAsync();
            console.log('Recording started...');
        } catch (error) {
            console.error('Recording error:', error);
            setIsListening(false);
            Alert.alert(
                'Recording Error',
                'Failed to start recording. Please try again.'
            );
        }
    };

    // Stop recording and transcribe
    const stopRecording = async () => {
        if (!recordingRef.current) return;

        setIsListening(false);
        setIsTranscribing(true);

        const recording = recordingRef.current;
        recordingRef.current = null;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (!uri) {
                Alert.alert('Error', 'Failed to get recording URI');
                setIsTranscribing(false);
                return;
            }

            console.log('Recording stopped, transcribing...');

            // Send to Whisper API for transcription
            try {
                const transcript = await transcribeAudio(uri);
                if (transcript && transcript.trim()) {
                    // Update both the internal state and the search
                    setManualText(transcript);
                    search(transcript);
                    console.log('✅ Transcribed:', transcript);
                } else {
                    Alert.alert('Transcription', 'No speech detected. Please try again.');
                }
            } catch (transcribeError) {
                console.error('Transcription error:', transcribeError);
                const errorMessage = transcribeError instanceof Error 
                    ? transcribeError.message 
                    : 'Failed to transcribe audio. Please check your OpenAI API key and network connection.';
                Alert.alert('Transcription Error', errorMessage);
            }
        } catch (error) {
            console.error('Stop recording error:', error);
            Alert.alert(
                'Error',
                error instanceof Error
                    ? error.message
                    : 'Failed to process recording. Please try again.'
            );
        } finally {
            setIsTranscribing(false);
        }
    };
 
    // Calculate related movies (Trending but not in current results)
    const relatedMovies = useMemo(() => {
        if (!homeData.trending || homeData.trending.length === 0) return [];
        const resultIds = results?.map(r => r.id) || [];
        return homeData.trending.filter(m => !resultIds.includes(m.id)).slice(0, 6);
    }, [homeData.trending, results]);
 
    // Local fallback matches from home lists (helps when TMDB returns empty).
    const localMatches = useMemo(() => {
        const searchText = query.trim().toLowerCase();
        if (!searchText) return [];
        const pool = [
            ...homeData.trending,
            ...homeData.popular,
            ...homeData.topRated,
            ...homeData.upcoming,
        ];
        const seen = new Set<number>();
        return pool.filter((movie) => {
            if (seen.has(movie.id)) return false;
            const title = (movie.title || movie.name || movie.original_title || '').toLowerCase();
            if (!title.includes(searchText)) return false;
            seen.add(movie.id);
            return true;
        });
    }, [homeData, query]);
 
    const combinedResults = useMemo(() => {
        if (!query.trim()) return results || [];
        const merged = [...(results || [])];
        const ids = new Set(merged.map((m) => m.id));
        localMatches.forEach((m) => {
            if (!ids.has(m.id)) merged.push(m);
        });
        return merged;
    }, [localMatches, query, results]);
 
    const renderItem = useCallback(({ item, index }: { item: Movie, index: number }) => (
        <Animated.View
            key={item.id}
            style={styles.cardWrapper}
            entering={FadeInDown.delay(index * 30)}
        >
            <MovieCard
                movie={item}
                width={SCREEN_WIDTH / 3 - 15}
                showRating={false}
                showTitle
            />
        </Animated.View>
    ), []);
 
    const ListFooterContent = useMemo(() => {
        if (query.trim().length > 0 && relatedMovies.length > 0) {
            return (
                <View style={styles.relatedSection}>
                    <Text style={styles.sectionTitle}>Related Content for "{query}"</Text>
                    <View style={styles.relatedGrid}>
                        {relatedMovies.map((item) => (
                            <View key={item.id} style={styles.cardWrapper}>
                                <MovieCard
                                    movie={item}
                                    width={SCREEN_WIDTH / 3 - 15}
                                    showRating={false}
                                    showTitle
                                />
                            </View>
                        ))}
                    </View>
                </View>
            );
        }
        return null;
    }, [query, relatedMovies]);
 
    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Search movies..."
                        placeholderTextColor={COLORS.textMuted}
                        value={query || manualText}
                        onChangeText={handleSearch}
                        onSubmitEditing={onSearchSubmit}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                    <TouchableOpacity
                        onPress={handleVoicePress}
                        style={styles.voiceButton}
                        accessibilityLabel="Voice search"
                        disabled={isTranscribing}
                    >
                        {isTranscribing ? (
                            <ActivityIndicator size="small" color={COLORS.accent} />
                        ) : (
                            <Ionicons
                                name={
                                    isVoiceSupported
                                        ? (isListening ? 'mic' : 'mic-outline')
                                        : 'mic-off'
                                }
                                size={20}
                                color={
                                    isVoiceSupported
                                        ? (isListening ? COLORS.accent : COLORS.textSecondary)
                                        : COLORS.textMuted
                                }
                            />
                        )}
                    </TouchableOpacity>
                    {query.length > 0 && Platform.OS !== 'ios' && (
                        <TouchableOpacity onPress={handleClear}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
 
            {/* Default View (No Query) */}
            {query.trim().length === 0 && !loading && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.sectionTitle}>Recommended Searches</Text>
                    <View style={styles.suggestionsGrid}>
                        {['Cyber', 'Tokyo', 'Dragon', 'Silent', 'Ocean', 'Velocity'].map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                style={styles.suggestionTag}
                                onPress={() => handleSuggestionClick(tag)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.suggestionTagText}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
 
                    <View style={styles.topSearchSection}>
                        <Text style={styles.sectionTitle}>Popular Content</Text>
                        {homeData.trending.slice(0, 4).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.topSearchItem}
                                onPress={() => handleSuggestionClick(item.title || item.name || 'Untitled')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.topSearchLeft}>
                                    <View style={styles.thumbnailWrapper}>
                                        <MovieCard movie={item} width={100} height={60} showRating={false} />
                                    </View>
                                    <Text style={styles.topSearchTitle} numberOfLines={1}>{item.title || item.name || 'Untitled'}</Text>
                                </View>
                                <Ionicons name="play-circle-outline" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
 
            {/* Results Grid */}
            <FlatList
                data={combinedResults || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    query.trim().length > 0 ? (
                        <Text style={styles.resultsTitle}>
                            {(combinedResults && combinedResults.length > 0) ? `Results for "${query}"` : null}
                        </Text>
                    ) : null
                }
                ListFooterComponent={ListFooterContent}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.skeletonGrid}>
                            {[...Array(9)].map((_, i) => (
                                <View key={i} style={styles.cardWrapper}>
                                    <MovieCardSkeleton
                                        index={i}
                                        width={SCREEN_WIDTH / 3 - 15}
                                        height={160}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (query.trim().length > 0 && (!combinedResults || combinedResults.length === 0) ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No matches for "{query}"</Text>
                        </View>
                    ) : null)
                }
            />
            <LinearGradient
                colors={['transparent', COLORS.background]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </SafeAreaView>
    );
}
 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    searchBarContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: SPACING.md,
        height: 52,
        borderRadius: 20,
        gap: SPACING.sm,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    voiceButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        paddingVertical: 10,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        zIndex: 5,
    },
    resultsList: {
        paddingHorizontal: 10,
        paddingBottom: 150,
    },
    cardWrapper: {
        padding: 4,
    },
    resultsTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: '800',
        marginVertical: SPACING.md,
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.md,
    },
    suggestionsContainer: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: 30,
    },
    suggestionTag: {
        backgroundColor: COLORS.backgroundTertiary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionTagText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
    },
    topSearchSection: {
        marginTop: 10,
    },
    topSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
        marginBottom: 10,
        paddingRight: 15,
        overflow: 'hidden',
    },
    topSearchLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    thumbnailWrapper: {
        marginRight: 15,
    },
    topSearchTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        flex: 1,
    },
    relatedSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.backgroundTertiary,
    },
    relatedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    }
});