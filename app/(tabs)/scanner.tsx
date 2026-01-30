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
import { Colors } from '@/constants/themes';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ExtractedData {
  text: string;
  confidence?: number;
  labels?: string[];
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
      form.append('imageType', 'Settings Page');
      form.append('receipt', {
        uri: capturedImage,
        type: 'image/jpeg',
        name: `capture-${Date.now()}.jpg`,
      } as any);
      form.append('context_user', 'jeevan');

      // Basic auth header
      const username = 'tektech';
      const password = 'Zx#Pq!8Mv@3R';
      const basic = btoa(`${username}:${password}`);

      console.log('Uploading image to Zentel AI...');
      
      const res = await fetch('https://api.zentelai.app/process-image-7', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
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

      // Extract and format the response
      const extractedInfo: ExtractedData = {
        text: result?.extracted_text || result?.text || 'No text extracted',
        confidence: result?.confidence || 0.8,
        labels: Array.isArray(result?.labels) ? result.labels : (Array.isArray(result?.categories) ? result.categories : []),
        ...result,
      };

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
            <>
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
            </>
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

          {!loading && (
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
              {/* Success Header */}
              {extractedData.extractedData?.success && (
                <View style={styles.successHeader}>
                  <View style={styles.successIcon}>
                    <ThemedText style={styles.checkmark}>✓</ThemedText>
                  </View>
                  <ThemedText style={styles.successTitle}>Extraction Complete</ThemedText>
                  <ThemedText style={styles.successSubtitle}>
                    Combined extracted data from captures
                  </ThemedText>
                </View>
              )}

              {/* Device Information Card */}
              {extractedData.extractedData && (
                <View style={styles.infoCard}>
                  <ThemedText style={styles.cardTitle}>Device Information</ThemedText>

                  {extractedData.extractedData['Model No'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Model:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Model No']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['Brand Name (MFG)'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Brand:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Brand Name (MFG)']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['Product Name'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Product:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Product Name']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['Product Type'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Type:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Product Type']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['Serial Number'] && extractedData.extractedData['Serial Number'] !== 'N/A' && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Serial:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Serial Number']}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Battery Information */}
              {(extractedData.extractedData?.['Battery Status'] ||
                extractedData.extractedData?.['Battery Percentage'] ||
                extractedData.extractedData?.['Battery Messages']) && (
                <View style={styles.infoCard}>
                  <ThemedText style={styles.cardTitle}>Battery Information</ThemedText>

                  {extractedData.extractedData['Battery Percentage'] && extractedData.extractedData['Battery Percentage'] !== 'N/A' && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Battery Health:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Battery Percentage']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['Battery Messages'] && extractedData.extractedData['Battery Messages'] !== 'N/A' && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Battery Messages:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['Battery Messages']}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* IMEI Information */}
              {(extractedData.extractedData?.['- Mobile (IMEI 1)'] ||
                extractedData.extractedData?.['- Mobile (IMEI 2)']) && (
                <View style={styles.infoCard}>
                  <ThemedText style={styles.cardTitle}>Mobile Information</ThemedText>

                  {extractedData.extractedData['- Mobile (IMEI 1)'] && extractedData.extractedData['- Mobile (IMEI 1)'] !== 'N/A' && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>IMEI 1:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['- Mobile (IMEI 1)']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.extractedData['- Mobile (IMEI 2)'] && extractedData.extractedData['- Mobile (IMEI 2)'] !== 'N/A' && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>IMEI 2:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.extractedData['- Mobile (IMEI 2)']}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Raw Data from About Section */}
              {extractedData.rawData?.About && (
                <View style={styles.infoCard}>
                  <ThemedText style={styles.cardTitle}>System Details</ThemedText>

                  {extractedData.rawData.About.Name && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Name:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.About.Name}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.rawData.About['iOS Version'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>iOS Version:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.About['iOS Version']}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.rawData.About['Model Name'] && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Model Name:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.About['Model Name']}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Media Information */}
              {extractedData.rawData?.Media && (
                <View style={styles.infoCard}>
                  <ThemedText style={styles.cardTitle}>Media Storage</ThemedText>

                  {extractedData.rawData.Media.Photos && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Photos:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.Media.Photos}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.rawData.Media.Videos && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Videos:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.Media.Videos}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.rawData.Media.Songs && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Songs:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.Media.Songs}
                      </ThemedText>
                    </View>
                  )}

                  {extractedData.rawData.Media.Applications && (
                    <View style={styles.cardRow}>
                      <ThemedText style={styles.cardLabel}>Applications:</ThemedText>
                      <ThemedText style={styles.cardValue}>
                        {extractedData.rawData.Media.Applications}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Warnings if any */}
              {extractedData.warnings && Array.isArray(extractedData.warnings) && extractedData.warnings.length > 0 && (
                <View style={[styles.infoCard, styles.warningCard]}>
                  <ThemedText style={styles.warningTitle}>⚠️ Warnings</ThemedText>
                  {extractedData.warnings.map((warning, index) => (
                    <View key={index} style={styles.warningItem}>
                      <ThemedText style={styles.warningText}>
                        • {warning.message}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={resetScanner}
            >
              <Text style={styles.buttonText}> Scan Again</Text>
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
    padding: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonGroup: {
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#00BF6F',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    flex: 1,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
  actionButtons: {
    marginTop: 20,
    gap: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
});
