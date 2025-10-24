/**
 * Event Listener Management System
 * 
 * Provides automatic cleanup of event listeners to prevent memory leaks
 * when navigating between routes or unmounting components.
 * 
 * Usage:
 *   import { addListener, cleanupListeners } from './eventManager.js';
 *   
 *   // Add a managed listener
 *   addListener(button, 'click', handleClick);
 *   
 *   // Clean up all listeners before route change
 *   cleanupListeners();
 */

import { debugLog, debugWarn } from './logger.js';

/**
 * Managed event listener record
 */
interface ManagedListener {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: AddEventListenerOptions | boolean;
}

/**
 * Store for all active managed listeners
 * Format: { element, event, handler, options }
 */
const activeListeners = new Map<string, ManagedListener>();

/**
 * Counter for generating unique listener IDs
 */
let listenerIdCounter = 0;

/**
 * Add a managed event listener that will be automatically cleaned up
 * @param element - Element to attach listener to
 * @param event - Event name (e.g., 'click', 'input')
 * @param handler - Event handler function
 * @param options - Event listener options (optional)
 * @returns Listener ID for manual removal if needed
 */
export function addListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions | boolean
): string | null {
  if (!element || typeof handler !== 'function') {
    debugWarn('addListener: Invalid element or handler', element, handler);
    return null;
  }

  // Add the event listener
  element.addEventListener(event, handler, options);

  // Store reference for cleanup
  const listenerId = `listener-${++listenerIdCounter}`;
  activeListeners.set(listenerId, {
    element,
    event,
    handler,
    options
  });

  // Get element name for logging (with type safety)
  const elementName = (element as HTMLElement).tagName || element.constructor?.name || 'Unknown';
  debugLog(`📎 Added managed listener #${listenerId}: ${event} on`, elementName);

  return listenerId;
}

/**
 * Remove a specific managed listener by ID
 * @param listenerId - ID returned from addListener
 * @returns True if listener was found and removed
 */
export function removeListener(listenerId: string): boolean {
  const listener = activeListeners.get(listenerId);
  
  if (!listener) {
    debugWarn(`removeListener: Listener ${listenerId} not found`);
    return false;
  }

  const { element, event, handler, options } = listener;
  element.removeEventListener(event, handler, options);
  activeListeners.delete(listenerId);

  debugLog(`🗑️ Removed managed listener #${listenerId}: ${event}`);
  return true;
}

/**
 * Remove all managed listeners (call before route changes)
 * @returns Number of listeners cleaned up
 */
export function cleanupListeners(): number {
  const count = activeListeners.size;
  
  if (count === 0) {
    debugLog('🧹 No listeners to clean up');
    return 0;
  }

  debugLog(`🧹 Cleaning up ${count} managed listeners...`);

  for (const [, listener] of activeListeners.entries()) {
    const { element, event, handler, options } = listener;
    try {
      element.removeEventListener(event, handler, options);
      const elementName = (element as HTMLElement).tagName || element.constructor?.name || 'Unknown';
      debugLog(`  ✓ Cleaned ${event} listener on`, elementName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      debugWarn(`  ✗ Failed to clean ${event} listener:`, message);
    }
  }

  activeListeners.clear();
  debugLog(`✅ Cleanup complete: ${count} listeners removed`);

  return count;
}

/**
 * Get count of currently active managed listeners
 * @returns Number of active listeners
 */
export function getListenerCount(): number {
  return activeListeners.size;
}

/**
 * Active listener details for debugging
 */
interface ListenerDetails {
  id: string;
  event: string;
  element: string;
  hasOptions: boolean;
}

/**
 * Get details of all active listeners (for debugging)
 * @returns Array of listener details
 */
export function getActiveListeners(): ListenerDetails[] {
  return Array.from(activeListeners.entries()).map(([id, listener]) => ({
    id,
    event: listener.event,
    element: (listener.element as HTMLElement).tagName || listener.element.constructor?.name || 'Unknown',
    hasOptions: !!listener.options
  }));
}

/**
 * Scoped listener manager for component-specific management
 */
interface ScopedManager {
  add(element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions | boolean): string | null;
  cleanup(): number;
  getCount(): number;
}

/**
 * Create a scoped listener manager for a specific component
 * Useful for components that need to manage their own listeners
 * 
 * @returns Scoped manager with add, cleanup methods
 */
export function createScopedManager(): ScopedManager {
  const scopedListeners = new Set<string>();

  return {
    /**
     * Add a listener to this scope
     */
    add(element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions | boolean): string | null {
      const id = addListener(element, event, handler, options);
      if (id) {
        scopedListeners.add(id);
      }
      return id;
    },

    /**
     * Clean up all listeners in this scope
     */
    cleanup(): number {
      let cleaned = 0;
      for (const listenerId of scopedListeners) {
        if (removeListener(listenerId)) {
          cleaned++;
        }
      }
      scopedListeners.clear();
      return cleaned;
    },

    /**
     * Get count of listeners in this scope
     */
    getCount(): number {
      return scopedListeners.size;
    }
  };
}

/**
 * Helper to add a one-time event listener that auto-cleans
 * @param element - Element to attach listener to
 * @param event - Event name
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Listener ID
 */
export function addOnceListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): string | null {
  const wrappedHandler = (e: Event): void => {
    handler(e);
    // Self-cleanup after execution
    if (listenerId) {
      removeListener(listenerId);
    }
  };

  const listenerId = addListener(element, event, wrappedHandler, { ...options, once: true });
  return listenerId;
}

/**
 * Add delegated event listener (for dynamically added elements)
 * @param parent - Parent element to attach listener to
 * @param event - Event name
 * @param selector - CSS selector for target elements
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Listener ID
 */
export function addDelegatedListener(
  parent: Element,
  event: string,
  selector: string,
  handler: EventListener,
  options?: AddEventListenerOptions | boolean
): string | null {
  const delegatedHandler = (e: Event): void => {
    const target = (e.target as Element).closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e);
    }
  };

  return addListener(parent, event, delegatedHandler, options);
}

export default {
  addListener,
  removeListener,
  cleanupListeners,
  getListenerCount,
  getActiveListeners,
  createScopedManager,
  addOnceListener,
  addDelegatedListener
};
