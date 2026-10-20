"use client";

import {
  ActionIcon,
  Autocomplete,
  Popover,
  Button,
  createTheme,
  Input,
  MantineProvider,
  Menu,
  Modal,
  NativeSelect,
  PasswordInput,
  SegmentedControl,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import type { CSSVariablesResolver } from "@mantine/core";
import type { ThemeProviderProps } from "./ThemeProvider.interfaces";
import st from "./ThemeProvider.module.css";

const theme = createTheme({
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  primaryColor: "mint",
  primaryShade: 3,
  autoContrast: true,
  activeClassName: "",
  black: "#182421",
  defaultRadius: "md",
  radius: { md: "var(--radius-control)", lg: "0.75rem", xl: "1.25rem" },
  colors: {
    dark: [
      "#eceef1",
      "#b0b5bf",
      "#9198a3",
      "#757b85",
      "#626873",
      "#35383d",
      "#2a2d33",
      "#1d1f23",
      "#17191d",
      "#141518",
    ],
    mint: [
      "#f0f8f5",
      "#e1efe9",
      "#cce5dd",
      "#b8d8ce",
      "#96c5b5",
      "#79ae9c",
      "#5c9482",
      "#467867",
      "#355f51",
      "#24473c",
    ],
  },
  headings: {
    fontWeight: "650",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.2" },
      h2: { fontSize: "1.5rem", lineHeight: "1.3" },
      h3: { fontSize: "1.125rem", lineHeight: "1.4" },
    },
  },
  components: {
    Button: Button.extend({
      defaultProps: { size: "md", radius: "var(--radius-button)" },
      classNames: (_theme, props) => ({
        root: props.size === "sm" ? `${st.button} ${st.compact}` : st.button,
        label: st.buttonLabel,
        inner: st.buttonInner,
      }),
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        size: 44,
        variant: "subtle",
        radius: "var(--radius-icon)",
      },
      classNames: { root: st.iconAction },
    }),
    Modal: Modal.extend({
      defaultProps: { centered: true, radius: "xl" },
      classNames: {
        content: st.modal,
        header: st.modalHeader,
        title: st.modalTitle,
        close: st.iconAction,
      },
    }),
    Input: Input.extend({
      defaultProps: { size: "md", radius: "var(--radius-input)" },
      classNames: { input: st.input },
    }),
    InputWrapper: Input.Wrapper.extend({ classNames: { label: st.label } }),
    TextInput: TextInput.extend({ defaultProps: { size: "md" } }),
    PasswordInput: PasswordInput.extend({
      defaultProps: {
        size: "md",
        visibilityToggleFocusable: true,
        rightSectionWidth: 48,
      },
      classNames: { visibilityToggle: st.visibilityToggle },
    }),
    Autocomplete: Autocomplete.extend({
      defaultProps: { size: "md" },
      classNames: { dropdown: st.dropdown, option: st.option },
    }),
    YearPickerInput: YearPickerInput.extend({ defaultProps: { size: "md" } }),
    Popover: Popover.extend({ classNames: { dropdown: st.dropdown } }),
    NativeSelect: NativeSelect.extend({ defaultProps: { size: "md" } }),
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        fullWidth: true,
        radius: "var(--radius-pill)",
        withItemsBorders: false,
      },
      classNames: {
        root: st.segmented,
        label: st.segmentLabel,
        indicator: st.segmentIndicator,
      },
    }),
    Tooltip: Tooltip.extend({
      classNames: { tooltip: st.tooltip },
      defaultProps: { multiline: true, maw: 240 },
    }),
    Menu: Menu.extend({
      defaultProps: { radius: "lg" },
      classNames: { dropdown: st.dropdown, item: st.menuItem },
    }),
  },
});

function resolveCssVariables(): ReturnType<CSSVariablesResolver> {
  return {
    variables: {},
    light: {},
    dark: {
      "--mantine-color-body": "var(--color-background)",
      "--mantine-color-text": "var(--color-text)",
      "--mantine-color-dimmed": "var(--color-text-muted)",
      "--mantine-color-placeholder": "var(--color-text-muted)",
      "--mantine-color-dark-4": "var(--color-border-control)",
      "--mantine-color-default": "var(--color-surface)",
      "--mantine-color-default-hover": "var(--color-surface-hover)",
      "--mantine-color-default-color": "var(--color-text)",
      "--mantine-color-default-border": "var(--color-border-control)",
      "--mantine-color-mint-filled": "var(--color-action)",
      "--mantine-color-mint-filled-hover": "var(--color-action-hover)",
      "--mantine-primary-color-contrast": "var(--color-on-action)",
      "--mantine-color-black": "var(--color-on-action)",
      "--mantine-color-error": "var(--color-error)",
      "--mantine-color-success": "var(--color-success)",
      "--mantine-color-red-filled": "var(--color-error)",
      "--mantine-color-red-filled-hover": "var(--color-error-hover)",
    },
  };
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={resolveCssVariables}
      forceColorScheme="dark"
    >
      {children}
    </MantineProvider>
  );
}
