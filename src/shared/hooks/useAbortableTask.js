import { useCallback, useEffect, useMemo, useRef } from 'react';

export const isAbortError = (error) =>
  error?.name === 'AbortError'
  || error?.code === 'ERR_CANCELED'
  || error?.message === 'canceled';

export const useAbortableTask = () => {
  const controllerRef = useRef(null);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const run = useCallback((task) => {
    abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    return Promise.resolve(task(controller.signal)).finally(() => {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    });
  }, [abort]);

  const isCurrentSignal = useCallback(
    (signal) => controllerRef.current?.signal === signal,
    []
  );

  useEffect(() => abort, [abort]);

  return useMemo(
    () => ({ abort, isCurrentSignal, run }),
    [abort, isCurrentSignal, run]
  );
};
