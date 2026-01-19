/**
 * Profile Screen
 * User profile with settings and app info
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../src/constants/theme';

// ============ Types ============

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    delay?: number;
}

// ============ Profile Avatar Component ============

const ProfileAvatar = () => (
    <Animated.View style={styles.avatarContainer} entering={FadeIn.delay(100)}>
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.avatarGradient}
        >
            <Text style={styles.avatarText}>U</Text>
        </LinearGradient>
        <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color={COLORS.text} />
        </View>
    </Animated.View>
);

// ============ Menu Item Component ============

const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    delay = 0,
}: MenuItemProps) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                <Animated.View style={[styles.menuItem, animatedStyle]}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name={icon} size={22} color={COLORS.text} />
                    </View>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuTitle}>{title}</Text>
                        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                    </View>
                    {showArrow && (
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.textMuted}
                        />
                    )}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

// ============ Section Header ============

const SectionHeader = ({ title, delay = 0 }: { title: string; delay?: number }) => (
    <Animated.Text
        style={styles.sectionHeader}
        entering={FadeInDown.delay(delay)}
    >
        {title}
    </Animated.Text>
);

// ============ Profile Screen Component ============

export default function ProfileScreen() {
    // Handle menu item presses
    const handleNotifications = useCallback(() => {
        Alert.alert('Notifications', 'Notification settings coming soon!');
    }, []);

    const handleDownloads = useCallback(() => {
        Alert.alert('Downloads', 'Download feature coming soon!');
    }, []);

    const handleMyList = useCallback(() => {
        Alert.alert('My List', 'My List feature coming soon!');
    }, []);

    const handlePlaybackSettings = useCallback(() => {
        Alert.alert('Playback', 'Playback settings coming soon!');
    }, []);

    const handleAppSettings = useCallback(() => {
        Alert.alert('App Settings', 'App settings coming soon!');
    }, []);

    const handleHelp = useCallback(() => {
        Linking.openURL('https://www.themoviedb.org/documentation/api');
    }, []);

    const handleTMDB = useCallback(() => {
        Linking.openURL('https://www.themoviedb.org/');
    }, []);

    const handlePrivacy = useCallback(() => {
        Alert.alert('Privacy', 'Privacy policy coming soon!');
    }, []);

    const handleSignOut = useCallback(() => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive' },
            ]
        );
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Animated.View style={styles.header} entering={FadeIn}>
                    <Text style={styles.title}>Profile</Text>
                </Animated.View>

                {/* Profile Card */}
                <Animated.View style={styles.profileCard} entering={FadeInDown.delay(100)}>
                    <ProfileAvatar />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Guest User</Text>
                        <Text style={styles.profileEmail}>Sign in to unlock all features</Text>
                    </View>
                </Animated.View>

                {/* Account Section */}
                <SectionHeader title="Account" delay={200} />
                <View style={styles.menuSection}>
                    <MenuItem
                        icon="person-outline"
                        title="Manage Account"
                        subtitle="Edit profile, password"
                        onPress={handleAppSettings}
                        delay={250}
                    />
                    <MenuItem
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Manage push notifications"
                        onPress={handleNotifications}
                        delay={300}
                    />
                </View>

                {/* Content Section */}
                <SectionHeader title="Content" delay={350} />
                <View style={styles.menuSection}>
                    <MenuItem
                        icon="download-outline"
                        title="Downloads"
                        subtitle="Manage offline content"
                        onPress={handleDownloads}
                        delay={400}
                    />
                    <MenuItem
                        icon="bookmark-outline"
                        title="My List"
                        subtitle="Your saved movies"
                        onPress={handleMyList}
                        delay={450}
                    />
                    <MenuItem
                        icon="play-circle-outline"
                        title="Playback"
                        subtitle="Video quality, autoplay"
                        onPress={handlePlaybackSettings}
                        delay={500}
                    />
                </View>

                {/* About Section */}
                <SectionHeader title="About" delay={550} />
                <View style={styles.menuSection}>
                    <MenuItem
                        icon="help-circle-outline"
                        title="Help"
                        subtitle="TMDB API documentation"
                        onPress={handleHelp}
                        delay={600}
                    />
                    <MenuItem
                        icon="film-outline"
                        title="About TMDB"
                        subtitle="Visit The Movie Database"
                        onPress={handleTMDB}
                        delay={650}
                    />
                    <MenuItem
                        icon="shield-outline"
                        title="Privacy Policy"
                        onPress={handlePrivacy}
                        delay={700}
                    />
                </View>

                {/* Sign Out */}
                <Animated.View
                    style={styles.signOutContainer}
                    entering={FadeInDown.delay(750)}
                >
                    <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </Pressable>
                </Animated.View>

                {/* App Info */}
                <Animated.View style={styles.appInfo} entering={FadeInDown.delay(800)}>
                    <Text style={styles.appName}>Matrix</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                    <Text style={styles.disclaimer}>
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </Text>
                </Animated.View>

                {/* TMDB Logo Attribution */}
                <Animated.View style={styles.tmdbAttribution} entering={FadeIn.delay(850)}>
                    <Text style={styles.attributionText}>Powered by</Text>
                    <View style={styles.tmdbLogo}>
                        <Text style={styles.tmdbLogoText}>TMDB</Text>
                    </View>
                </Animated.View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
            <LinearGradient
                colors={['transparent', COLORS.background]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </SafeAreaView>
    );
}

// ============ Styles ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xxl,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxxl,
        fontWeight: '700',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.lg,
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: '700',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    profileInfo: {
        marginLeft: SPACING.lg,
        flex: 1,
    },
    profileName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xl,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    profileEmail: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    sectionHeader: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
    },
    menuSection: {
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.backgroundSecondary,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '500',
    },
    menuSubtitle: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        marginTop: 2,
    },
    signOutContainer: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.xxl,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
    },
    signOutText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    appInfo: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
        paddingHorizontal: SPACING.xxl,
    },
    appName: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.xl,
        fontWeight: '800',
        letterSpacing: 2,
    },
    appVersion: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
        marginTop: SPACING.xs,
    },
    disclaimer: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        textAlign: 'center',
        marginTop: SPACING.md,
        lineHeight: 18,
    },
    tmdbAttribution: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        gap: SPACING.sm,
    },
    attributionText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
    },
    tmdbLogo: {
        backgroundColor: '#01D277',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    tmdbLogoText: {
        color: '#081C22',
        fontSize: FONT_SIZES.sm,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: Platform.OS === 'ios' ? 120 : 100,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        zIndex: 5,
    },
});
