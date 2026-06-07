import { StyleProp, TextStyle } from "react-native";

import { styles } from "../styles/appStyles";

export function toneClass(tone: "green" | "yellow" | "red"): StyleProp<TextStyle> {
  if (tone === "green") return styles.risk_green;
  if (tone === "yellow") return styles.risk_yellow;
  return styles.risk_red;
}
