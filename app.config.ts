import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Matrix",
  slug: "matrix",
  scheme: "matrix",
  ios: {
    ...config.ios,
    bundleIdentifier: "com.matrix", // Explicitly set to match Android
    supportsTablet: true,
  },
  android: {
    ...config.android,
    package: "com.matrix",
  },
  plugins: [
    ...(config.plugins || []),
    ["./plugins/withPlugin.js"], // Your local plugin
    [
      "react-native-auth0",
      {
        domain: "dev-wsherv2c1s00n8pa.us.auth0.com",
        clientId: "tIy58ClruMMBEXwn4bfvtP5cGvWPa1Y1",
      },
    ],
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
});
