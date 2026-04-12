// Debe ser el primer import (Fast Refresh / Metro).
import "@expo/metro-runtime";

import { renderRootComponent } from "expo-router/build/renderRootComponent";

import { App } from "./AppEntry";

renderRootComponent(App);
