import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/expo-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/src/constants/theme';

interface ExtractedData {
  text: string;
  confidence?: number;
  labels?: string[];
  rawResponse?: any;
  extractedData?: Record<string, any>;
  [key: string]: any;
}

export default function ScannerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Helper: Check if response has meaningful extracted data
  const responseHasExtraction = (r: any) => {
    if (!r) return false;
    if (r.success) return true;
    const extracted = r?.extractedData?.extractedData;
    if (!extracted || typeof extracted !== 'object') return false;
    const skip = new Set([
      'image_clarity_percentage',
      'extraction_source',
      'confidence_notes',
      'image_type_warning',
      'detected_image_type',
      'missing_fields',
    ]);
    for (const k of Object.keys(extracted)) {
      if (skip.has(k)) continue;
      const v = extracted[k];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s === '' || s === 'N/A') continue;
      return true;
    }
    return false;
  };

  // Helper: Normalize display entries for better formatting
  const normalizeDisplayEntries = (obj: any) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    try {
      // Define field display names and types
      const fieldConfig: Record<string, { label: string; type: 'string' | 'array' | 'object' | 'number' }> = {
        title: { label: 'Title', type: 'string' },
        original_title: { label: 'Original Title', type: 'string' },
        year: { label: 'Year', type: 'string' },
        description: { label: 'Description', type: 'string' },
        director: { label: 'Director', type: 'string' },
        writers: { label: 'Writers', type: 'array' },
        producers: { label: 'Producers', type: 'array' },
        cast: { label: 'Cast', type: 'array' },
        genres: { label: 'Genres', type: 'array' },
        runtime_minutes: { label: 'Runtime', type: 'number' },
        rating: { label: 'Rating', type: 'string' },
        language: { label: 'Language', type: 'string' },
        country: { label: 'Country', type: 'string' },
        release_date: { label: 'Release Date', type: 'string' },
        imdb_id: { label: 'IMDb ID', type: 'string' },
        production_company: { label: 'Production Company', type: 'string' },
        distributor: { label: 'Distributor', type: 'string' },
      };

      const out: [string, any][] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip if value is null or undefined
        if (value === null || value === undefined) continue;
        
        // Skip empty arrays and empty strings
        if (Array.isArray(value) && value.length === 0) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        
        const config = fieldConfig[key];
        const label = config?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        out.push([label, value]);
      }
      
      return out;
    } catch (err) {
      console.error('normalizeDisplayEntries failed', err);
      return [];
    }
  };

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        
        if (photo) {
          setCapturedImage(photo.uri);
          setCapturedImageBase64(photo.base64 ?? null);
          setIsCameraActive(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
        console.error('Camera capture error:', error);
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        setCapturedImageBase64(asset.base64 ?? null);
        setIsCameraActive(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const sendImageToApi = async () => {
    if (!capturedImage) {
      Alert.alert('No image', 'Capture or pick an image first.');
      return;
    }

    setLoading(true);
    try {
      // Get base64 data
      const base64Data = capturedImageBase64 || await convertUriToBase64(capturedImage);

      // For React Native, use the URI directly with FormData
      const form = new FormData();
      form.append('image', {
        uri: capturedImage,
        type: 'image/jpeg',
        name: `capture-${Date.now()}.jpg`,
      } as any);

      console.log('Uploading image to Zentel AI...');
       const username = "tektech";
      const password = "Zx#Pq!8Mv@3R";
      const basic =
        typeof btoa === "function" ? btoa(`${username}:${password}`) : "";
      
      const res = await fetch('https://api.zentelai.app/movie', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'context_user': 'jeevan',
        },
        body: form,
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('API Error:', text);
        throw new Error(
          `Upload failed: ${res.status} ${res.statusText} ${text}`
        );
      }

      const result = await res.json();
      console.log('API Response:', result);
      console.log('API Response Keys:', Object.keys(result));
      console.log('Full Response Structure:', JSON.stringify(result, null, 2));

      const extractedInfo: ExtractedData = {
        text: result?.title || 'No title extracted',
        confidence: 0.95,
        labels: result?.genres || [],
        rawResponse: result,
        extractedData: result,
        ...result,
      };

      console.log('Extracted Info:', extractedInfo);
      setExtractedData(extractedInfo);
    } catch (error) {
      console.error('API error:', error);
      Alert.alert(
        'Error',
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      setExtractedData({
        text: 'Failed to extract data from image',
        confidence: 0,
        labels: ['error'],
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const convertUriToBase64 = async (uri: string): Promise<string> => {
    // expo-file-system is not imported globally; use fetch to read the file as blob then to base64
    const blob = await fetch(uri).then(r => r.blob());
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setCapturedImageBase64(null);
    setExtractedData(null);
    setIsCameraActive(true);
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Camera permission is required</ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={requestPermission}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {!capturedImage ? (
        <>
          {isCameraActive ? (
            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
              >
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: colors.tint }]}
                    onPress={() => setIsCameraActive(false)}
                  >
                    <Text style={styles.buttonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>

              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={[styles.captureButton, { backgroundColor: colors.tint }]}
                  onPress={handleCapturePhoto}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.contentContainer}>
              <View style={styles.imagePreview}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.placeholderImage}
                />
              </View>

              <ThemedText style={styles.title}>Image Scanner</ThemedText>
              <ThemedText style={styles.subtitle}>
                Capture or upload an image to extract data
              </ThemedText>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.tint }]}
                  onPress={() => setIsCameraActive(true)}
                >
                  <Text style={styles.buttonText}> Capture Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.tabIconDefault }]}
                  onPress={handlePickImage}
                >
                  <Text style={styles.buttonText}> Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
            />
          </View>

          {!loading && !extractedData && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={sendImageToApi}
              >
                <Text style={styles.buttonText}>Proceed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tabIconDefault }]}
                onPress={resetScanner}
              >
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText style={styles.loadingText}>Processing image...</ThemedText>
            </View>
          )}

          {extractedData && !loading && (
            <View style={styles.dataContainer}>
              {/* OTT Platform Style View */}
              {extractedData && (
                <ScrollView style={styles.ottContainer}>
                  {/* Backdrop/Poster Section */}
                  <View style={styles.backdropSection}>
                    <Image
                      source={{ uri: capturedImage }}
                      style={styles.backdropImage}
                    />
                    <View style={styles.gradientOverlay} />
                    <TouchableOpacity style={styles.playButtonOverlay}>
                      <Text style={styles.playIcon}>▶</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Movie Info Section */}
                  <View style={styles.movieInfoSection}>
                    <ThemedText style={styles.movieTitle}>
                      {extractedData.title || 'Movie Title'}
                    </ThemedText>
                    
                    {extractedData.original_title && (
                      <ThemedText style={styles.originalTitle}>
                        {extractedData.original_title}
                      </ThemedText>
                    )}

                    {/* Metadata Row */}
                    <View style={styles.metadataRow}>
                      {extractedData.year && (
                        <ThemedText style={styles.metadataItem}>
                          {extractedData.year}
                        </ThemedText>
                      )}
                      {extractedData.runtime_minutes && (
                        <>
                          <ThemedText style={styles.metadataItem}>•</ThemedText>
                          <ThemedText style={styles.metadataItem}>
                            {extractedData.runtime_minutes}m
                          </ThemedText>
                        </>
                      )}
                    </View>

                    {/* Genres */}
                    {extractedData.genres && Array.isArray(extractedData.genres) && extractedData.genres.length > 0 && (
                      <View style={styles.genresRow}>
                        {extractedData.genres.slice(0, 3).map((genre: string, idx: number) => (
                          <ThemedText key={idx} style={styles.genreTag}>{genre}</ThemedText>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* About Section */}
                  {extractedData.description && (
                    <View style={styles.sectionContainer}>
                      <ThemedText style={styles.sectionTitle}>About</ThemedText>
                      <ThemedText style={styles.descriptionText}>
                        {extractedData.description}
                      </ThemedText>
                    </View>
                  )}

                  {/* Director */}
                  {extractedData.director && (
                    <View style={styles.sectionContainer}>
                      <ThemedText style={styles.sectionTitle}>Director</ThemedText>
                      <ThemedText style={styles.sectionValue}>
                        {extractedData.director}
                      </ThemedText>
                    </View>
                  )}

                  {/* Cast Section */}
                  {extractedData.cast && Array.isArray(extractedData.cast) && extractedData.cast.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <ThemedText style={styles.sectionTitle}>Cast</ThemedText>
                      <View style={styles.castHorizontalScroll}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.castScrollView}
                        >
                          {extractedData.cast.map((member: any, idx: number) => (
                            <View key={idx} style={styles.castMemberContainer}>
                              <View style={styles.castAvatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                  {member.actor ? member.actor.charAt(0).toUpperCase() : '?'}
                                </Text>
                              </View>
                              <ThemedText style={styles.castMemberName} numberOfLines={1}>
                                {member.actor || 'Unknown'}
                              </ThemedText>
                              <ThemedText style={styles.castMemberRole} numberOfLines={1}>
                                {member.role || 'Role'}
                              </ThemedText>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}

                  {/* Additional Info */}
                  <View style={styles.additionalInfoContainer}>
                    {extractedData.language && (
                      <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>Language</ThemedText>
                        <ThemedText style={styles.infoValue}>{extractedData.language}</ThemedText>
                      </View>
                    )}
                    {extractedData.country && (
                      <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>Country</ThemedText>
                        <ThemedText style={styles.infoValue}>{extractedData.country}</ThemedText>
                      </View>
                    )}
                    {extractedData.release_date && (
                      <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>Release Date</ThemedText>
                        <ThemedText style={styles.infoValue}>{extractedData.release_date}</ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.bottomSpacer} />
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={resetScanner}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    opacity: 0.3,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 0,
    justifyContent: 'center',
  },
  imagePreview: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonGroup: {
    gap: 12,
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  previewContainer: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  dataContainer: {
    marginVertical: 20,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00BF6F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkmark: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#00BF6F',
  },
  successSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00BF6F',
  },
  extractedDataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  extractedCardHeader: {
    backgroundColor: '#00BF6F',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  extractedCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  extractedDataContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  dataItem: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  dataKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dataValueFormatted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 22,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
    flex: 0.4,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
    color: '#00BF6F',
  },
  warningCard: {
    borderLeftColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FF9500',
  },
  warningItem: {
    paddingVertical: 6,
  },
  warningText: {
    fontSize: 13,
    opacity: 0.8,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dataSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    opacity: 0.7,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  messageText: {
    fontSize: 13,
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noDataContainer: {
    paddingVertical: 20,
  },
  actionButtons: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  arrayContainer: {
    marginTop: 8,
  },
  arrayItem: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  castItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#00BF6F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  // OTT Platform Styles
  ottContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backdropSection: {
    width: '100%',
    height: 300,
    position: 'relative',
    marginBottom: 20,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 191, 111, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 36,
    color: '#ffffff',
    marginLeft: 4,
  },
  movieInfoSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  originalTitle: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metadataItem: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: '500',
  },
  genresRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  genreTag: {
    fontSize: 12,
    color: '#cccccc',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  sectionValue: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  castHorizontalScroll: {
    marginBottom: 8,
  },
  castScrollView: {
    flexGrow: 0,
  },
  castMemberContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 90,
  },
  castAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#00BF6F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  castMemberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  castMemberRole: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    marginTop: 2,
  },
  additionalInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
