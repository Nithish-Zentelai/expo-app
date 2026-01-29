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
      const base64Data = capturedImageBase64
        ? capturedImageBase64
        : await convertUriToBase64(capturedImage);

      // Use Gemini API with hardcoded key
      const geminiKey = 'AIzaSyDSD2fpsXpk-RVbV2CPEStxvNqDcUH8wtQ';
      if (geminiKey) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

        const body = {
          contents: [
            {
              parts: [
                {
                  text:
                    'identify and tell more data  about the image . Return JSON with fields: text, labels (array), confidence (0-1). If unsure, estimate.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Gemini error: ${response.status}`);
        }

        const result = await response.json();
        const modelText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        let parsed: ExtractedData;
        try {
          parsed = JSON.parse(modelText);
        } catch (jsonError) {
          parsed = {
            text: modelText,
            message: 'Parsed as plain text because JSON parsing failed.',
          };
        }

        setExtractedData(parsed);
        return;
      }

      // Free fallback: OCR.Space demo key (subject to rate limits). Use EXPO_PUBLIC_OCR_API_KEY to override.
      const ocrKey = process.env.EXPO_PUBLIC_OCR_API_KEY || 'helloworld';
      const formData = new FormData();
      formData.append('apikey', ocrKey);
      formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR error: ${ocrResponse.status}`);
      }

      const ocrResult = await ocrResponse.json();
      const parsedText =
        ocrResult?.ParsedResults?.[0]?.ParsedText?.trim() || 'No text found.';

      setExtractedData({
        text: parsedText,
        labels: ['ocr'],
        confidence: 0.5,
        message: ocrKey === 'helloworld'
          ? 'Using free demo OCR key (rate limited). Add EXPO_PUBLIC_OCR_API_KEY for more reliable results.'
          : 'OCR extracted text.',
      });
    } catch (error) {
      console.error('API error:', error);
      Alert.alert('Error', 'Failed to process image. Check API key and connectivity.');
      
      setExtractedData({
        text: 'Sample extracted text from image',
        confidence: 0.95,
        labels: ['document', 'text', 'scan'],
        message: 'API endpoint not configured. This is demo data.',
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
              <ThemedText style={styles.dataTitle}>Extracted Data</ThemedText>

              {extractedData.text && (
                <View style={styles.dataSection}>
                  <ThemedText style={styles.dataLabel}>Text:</ThemedText>
                  <ThemedText style={styles.dataValue}>{extractedData.text}</ThemedText>
                </View>
              )}

              {extractedData.confidence && (
                <View style={styles.dataSection}>
                  <ThemedText style={styles.dataLabel}>Confidence:</ThemedText>
                  <ThemedText style={styles.dataValue}>
                    {(extractedData.confidence * 100).toFixed(2)}%
                  </ThemedText>
                </View>
              )}

              {extractedData.labels && Array.isArray(extractedData.labels) && (
                <View style={styles.dataSection}>
                  <ThemedText style={styles.dataLabel}>Labels:</ThemedText>
                  <View style={styles.labelsContainer}>
                    {extractedData.labels.map((label, index) => (
                      <View
                        key={index}
                        style={[styles.label, { backgroundColor: colors.tint }]}
                      >
                        <Text style={styles.labelText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {extractedData.message && (
                <View style={[styles.dataSection, styles.messageBox]}>
                  <ThemedText style={styles.messageText}>
                    ℹ️ {extractedData.message}
                  </ThemedText>
                </View>
              )}

              {/* Display any additional extracted fields */}
              {Object.entries(extractedData).map(([key, value]) => {
                if (!['text', 'confidence', 'labels', 'message'].includes(key)) {
                  return (
                    <View key={key} style={styles.dataSection}>
                      <ThemedText style={styles.dataLabel}>{key}:</ThemedText>
                      <ThemedText style={styles.dataValue}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </ThemedText>
                    </View>
                  );
                }
              })}
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
