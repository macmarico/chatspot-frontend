import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

/**
 * Custom hook to subscribe to WatermelonDB observables
 * @param observable$ The WatermelonDB observable to subscribe to (can be null)
 * @param initialValue Optional initial value to use before the observable emits
 * @returns The latest value emitted by the observable
 */
export function useWatermelonObservable<T>(observable$: Observable<T> | null, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // Only subscribe if we have a valid observable
    if (!observable$) return;

    // Subscribe to the observable
    const subscription = observable$.subscribe(newValue => {
      setValue(newValue);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [observable$]);

  return value;
}
