# SKILL: Responsive Layouts (Mobile)

GOAL:
Ensure components and screens adapt correctly to all mobile device sizes and safe areas.

RULES:
- **Safe Area**: Always use `useSafeAreaInsets` from `react-native-safe-area-context` for top (notches) and bottom (home indicators) spacing.
- **Dimensions**: Use `useWindowDimensions` for dynamic calculations based on screen width or height.
- **Flexbox**: Prefer `flex: 1` and `justifyContent`/`alignItems` over fixed heights/widths whenever possible.
- **Platform Specifics**: Use `Platform.select` or `Platform.OS` to handle differences between iOS, Android, and Web.
- **Testing**: Verify that elements are not cut off in devices with different aspect ratios (e.g., iPhone 15 vs older Androids).

STEPS:
1. Import `useSafeAreaInsets`.
2. Apply `paddingTop: insets.top` or `paddingBottom: insets.bottom` to the main container.
3. Use `ScrollView` for content that might exceed screen height.
4. Check layout in both portrait and landscape if applicable.
