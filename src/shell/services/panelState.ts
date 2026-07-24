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
  if (chrome.leftExpanded === v) return;
  chrome = { ...chrome, leftExpanded: v };
  emit();
}

export function setLeftPinned(v: boolean) {
  const leftExpanded = v || chrome.leftExpanded;
  if (chrome.leftPinned === v && chrome.leftExpanded === leftExpanded) return;
  chrome = { ...chrome, leftPinned: v, leftExpanded };
  emit();
}

export function toggleLeftPin() {
  setLeftPinned(!chrome.leftPinned);
}

export function setRightOpen(v: boolean) {
  if (chrome.rightPinned && !v) return;
  if (chrome.rightOpen === v) return;
  chrome = { ...chrome, rightOpen: v };
  emit();
}

export function setRightPinned(v: boolean) {
  const rightOpen = v || chrome.rightOpen;
  if (chrome.rightPinned === v && chrome.rightOpen === rightOpen) return;
  chrome = { ...chrome, rightPinned: v, rightOpen };
  emit();
}

export function toggleRightPin() {
  setRightPinned(!chrome.rightPinned);
}

export function setInspectorTab(tab: InspectorTab) {
  if (chrome.inspectorTab === tab) return;
  chrome = { ...chrome, inspectorTab: tab };
  emit();
}

export function setNotifyPopoverOpen(v: boolean) {
  if (chrome.notifyPopoverOpen === v) return;
  chrome = { ...chrome, notifyPopoverOpen: v };
  emit();
}

export function toggleNotifyPopover() {
  setNotifyPopoverOpen(!chrome.notifyPopoverOpen);
}
