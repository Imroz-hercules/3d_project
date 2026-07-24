/**
 * Minimal panel chrome state for C+ overlays.
 * Not a full chrome store — only pin/expand/tab/popover.
 */

import { useSyncExternalStore } from 'react';
import type { InspectorTab, PanelChrome } from './types';

type Listener = () => void;

let chrome: PanelChrome = {
  leftExpanded: false,
  leftPinned: false,
  rightOpen: false,
  rightPinned: false,
  inspectorTab: 'machine',
  notifyPopoverOpen: false,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return chrome;
}

export function usePanelChrome(): PanelChrome {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setLeftExpanded(v: boolean) {
  if (chrome.leftPinned && !v) return;
  chrome = { ...chrome, leftExpanded: v };
  emit();
}

export function setLeftPinned(v: boolean) {
  chrome = { ...chrome, leftPinned: v, leftExpanded: v || chrome.leftExpanded };
  emit();
}

export function toggleLeftPin() {
  setLeftPinned(!chrome.leftPinned);
}

export function setRightOpen(v: boolean) {
  if (chrome.rightPinned && !v) return;
  chrome = { ...chrome, rightOpen: v };
  emit();
}

export function setRightPinned(v: boolean) {
  chrome = { ...chrome, rightPinned: v, rightOpen: v || chrome.rightOpen };
  emit();
}

export function toggleRightPin() {
  setRightPinned(!chrome.rightPinned);
}

export function setInspectorTab(tab: InspectorTab) {
  chrome = { ...chrome, inspectorTab: tab };
  emit();
}

export function setNotifyPopoverOpen(v: boolean) {
  chrome = { ...chrome, notifyPopoverOpen: v };
  emit();
}

export function toggleNotifyPopover() {
  setNotifyPopoverOpen(!chrome.notifyPopoverOpen);
}
