/**
 * @file UI display helpers — tone/risk badge mapping and similar.
 */

import { StyleProp, TextStyle } from "react-native";

import { styles } from "../styles/appStyles";

/**
 * Returns the correct risk badge style for a given tone.
 *
 * @param tone - The risk level: "green", "yellow", or "red".
 * @returns The matching StyleProp from appStyles (risk_green, risk_yellow, risk_red).
 */
export function toneClass(tone: "green" | "yellow" | "red"): StyleProp<TextStyle> {
    if (tone === "green") return styles.risk_green;
    if (tone === "yellow") return styles.risk_yellow;
    return styles.risk_red;
}
