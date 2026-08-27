import { useEffect, useState } from "react";
import * as THREE from "three";

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Keyboard input state for lane switching and jumping
  let keyDown: string[] = [];
  
  // Player movement target (for smooth transitions)
  let currentLane: number | null = null;
  let isJumping: boolean = false;
  const jumpVelocity = -0.15; // Jump up velocity per frame
  const gravity = 0.03; // Gravity pulling player down
