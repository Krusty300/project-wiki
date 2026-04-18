import { useState, useCallback, useRef, useEffect } from 'react';

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
  offset?: number;
  onComplete?: () => void;
}

interface ScrollToOptions extends SmoothScrollOptions {
  container?: HTMLElement | Window;
  x?: number;
  y?: number;
}

interface ScrollToElementOptions extends SmoothScrollOptions {
  container?: HTMLElement;
  element: HTMLElement;
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) => {
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
      ? Math.pow(2, 20 * t - 10) / 2 
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
};

// Main smooth scroll function
export function smoothScrollTo(options: ScrollToOptions): Promise<void> {
  return new Promise((resolve) => {
    const {
      x = 0,
      y = 0,
      duration = 300,
      easing = easingFunctions.easeInOutCubic,
      offset = 0,
      container = window,
      onComplete,
    } = options;

    const startTime = performance.now();
    const startX = container === window ? window.scrollX : (container as HTMLElement).scrollLeft;
    const startY = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
    const targetX = x + offset;
    const targetY = y + offset;
    const distanceX = targetX - startX;
    const distanceY = targetY - startY;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const currentX = startX + distanceX * easedProgress;
      const currentY = startY + distanceY * easedProgress;

      if (container === window) {
        window.scrollTo(currentX, currentY);
      } else {
        (container as HTMLElement).scrollLeft = currentX;
        (container as HTMLElement).scrollTop = currentY;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// Scroll to element smoothly
export function smoothScrollToElement(options: ScrollToElementOptions): Promise<void> {
  return new Promise((resolve) => {
    const {
      element,
      container,
      duration = 300,
      easing = easingFunctions.easeInOutCubic,
      offset = 0,
      block = 'start',
      inline = 'start',
      onComplete,
    } = options;

    if (!element) {
      resolve();
      return;
    }

    const containerRect = container ? container.getBoundingClientRect() : { top: 0, left: 0, height: window.innerHeight, width: window.innerWidth, bottom: window.innerHeight, right: window.innerWidth };
    const elementRect = element.getBoundingClientRect();
    
    let targetY: number;
    let targetX: number;

    // Calculate vertical position
    switch (block) {
      case 'center':
        targetY = elementRect.top + elementRect.height / 2 - (container ? containerRect.height / 2 : window.innerHeight / 2);
        break;
      case 'end':
        targetY = elementRect.bottom - (container ? containerRect.height : window.innerHeight);
        break;
      case 'nearest':
        if (elementRect.top < containerRect.top) {
          targetY = elementRect.top;
        } else if (elementRect.bottom > containerRect.bottom) {
          targetY = elementRect.bottom - (container ? containerRect.height : window.innerHeight);
        } else {
          targetY = container ? container.scrollTop : window.scrollY;
          resolve();
          return;
        }
        break;
      case 'start':
      default:
        targetY = elementRect.top;
        break;
    }

    // Calculate horizontal position
    switch (inline) {
      case 'center':
        targetX = elementRect.left + elementRect.width / 2 - (container ? containerRect.width / 2 : window.innerWidth / 2);
        break;
      case 'end':
        targetX = elementRect.right - (container ? containerRect.width : window.innerWidth);
        break;
      case 'nearest':
        if (elementRect.left < containerRect.left) {
          targetX = elementRect.left;
        } else if (elementRect.right > containerRect.right) {
          targetX = elementRect.right - (container ? containerRect.width : window.innerWidth);
        } else {
          targetX = container ? container.scrollLeft : window.scrollX;
          resolve();
          return;
        }
        break;
      case 'start':
      default:
        targetX = elementRect.left;
        break;
    }

    const currentScrollY = container ? (container as HTMLElement).scrollTop : window.scrollY;
    const currentScrollX = container ? (container as HTMLElement).scrollLeft : window.scrollX;

    smoothScrollTo({
      x: currentScrollX + targetX,
      y: currentScrollY + targetY + offset,
      duration,
      easing,
      container: container || window,
      onComplete: () => {
        onComplete?.();
        resolve();
      },
    });
  });
}

// Hook for smooth scrolling
export function useSmoothScrolling(options: SmoothScrollOptions = {}) {
  const {
    duration = 300,
    easing = easingFunctions.easeInOutCubic,
    offset = 0,
  } = options;

  const scrollToRef = useRef<Function>(() => () => Promise.resolve());
  const scrollToElementRef = useRef<Function>(() => () => Promise.resolve());

  scrollToRef.current = useCallback((scrollOptions: ScrollToOptions) => {
    return smoothScrollTo({
      ...scrollOptions,
      duration: scrollOptions.duration || duration,
      easing: scrollOptions.easing || easing,
      offset: scrollOptions.offset || offset,
    });
  }, [duration, easing, offset]);

  scrollToElementRef.current = useCallback((scrollOptions: ScrollToElementOptions) => {
    return smoothScrollToElement({
      ...scrollOptions,
      duration: scrollOptions.duration || duration,
      easing: scrollOptions.easing || easing,
      offset: scrollOptions.offset || offset,
    });
  }, [duration, easing, offset]);

  return {
    scrollTo: scrollToRef.current,
    scrollToElement: scrollToElementRef.current,
    scrollToTop: (container?: HTMLElement | Window) => 
      scrollToRef.current?.({ y: 0, container: container || window }),
    scrollToBottom: (container?: HTMLElement | Window) => 
      scrollToRef.current?.({ y: (container === window ? document.body.scrollHeight : (container as HTMLElement)?.scrollHeight) || 0, container: container || window }),
    scrollToLeft: (container?: HTMLElement | Window) => 
      scrollToRef.current?.({ x: 0, container: container || window }),
    scrollToRight: (container?: HTMLElement | Window) => 
      scrollToRef.current?.({ x: (container === window ? document.body.scrollWidth : (container as HTMLElement)?.scrollWidth) || 0, container: container || window }),
  };
}

// Hook for scroll-based animations
export function useScrollAnimation(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    threshold?: number;
    rootMargin?: string;
    onIntersect?: (entry: IntersectionObserverEntry) => void;
    onLeave?: (entry: IntersectionObserverEntry) => void;
  } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    onIntersect,
    onLeave,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect?.(entry);
          } else {
            onLeave?.(entry);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, threshold, rootMargin, onIntersect, onLeave]);
}

// Hook for scroll position tracking
export function useScrollPosition(
  containerRef?: React.RefObject<HTMLElement>
) {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const container = containerRef?.current || window;
    
    const handleScroll = () => {
      const x = container === window ? window.scrollX : (container as HTMLElement).scrollLeft;
      const y = container === window ? window.scrollY : (container as HTMLElement).scrollTop;
      
      setScrollPosition({ x, y });
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial scroll position
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef]);

  return {
    scrollPosition,
    isScrolling,
    scrollTo: (x: number, y: number) => {
      const container = containerRef?.current || window;
      if (container === window) {
        window.scrollTo(x, y);
      } else {
        (container as HTMLElement).scrollLeft = x;
        (container as HTMLElement).scrollTop = y;
      }
    },
  };
}

// Export easing functions for external use
export { easingFunctions };
