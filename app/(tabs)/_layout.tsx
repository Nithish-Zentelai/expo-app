/**
 * Tab Layout
 * Custom floating liquid glass tab bar with iOS-style design
 * Features 3D glass ball indicator and neon blue active states
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Blue for active state
const ACTIVE_BLUE = '#00A3FF';

// ============ Tab Bar Icon Component ============

interface TabIconProps {
    name: keyof typeof Ionicons.glyphMap;
    focused: boolean;
    color: string;
}

function TabBarIcon({ name, focused, color }: TabIconProps) {
    const scale = useSharedValue(focused ? 1 : 0.9);

    scale.value = withSpring(focused ? 1.1 : 0.95, {
        damping: 12,
        stiffness: 200,
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
        ],
    }));

    return (
        <View style={styles.iconWrapper}>
            {focused && (
                <Animated.View style={styles.glassIndicator}>
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.glassInnerShine} />
                </Animated.View>
            )}
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <Ionicons
                    name={name}
                    size={24}
                    color={focused ? ACTIVE_BLUE : 'rgba(255, 255, 255, 0.5)'}
                />
            </Animated.View>
        </View>
    );
}

// ============ Tab Layout ============

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: ACTIVE_BLUE,
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarHideOnKeyboard: true,
                tabBarBackground: () => (
                    <View style={StyleSheet.absoluteFill}>
                        <LinearGradient
                            colors={['rgba(40, 40, 40, 0.75)', 'rgba(10, 10, 10, 0.95)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.tabBarEdgeGlow} />
                    </View>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? 'home' : 'home-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? 'search' : 'search-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? 'person' : 'person-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

// ============ Styles ============

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 35 : 25,
        left: 20,
        right: 20,
        height: 75,
        borderRadius: 40,
        backgroundColor: 'rgba(20, 20, 20, 0.3)',
        borderTopWidth: 0,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 0 : 12,
    },
    tabBarEdgeGlow: {
        ...StyleSheet.absoluteFillObject,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
    },
    iconContainer: {
        zIndex: 2,
    },
    glassIndicator: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    glassInnerShine: {
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '70%',
        height: '35%',
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
});
