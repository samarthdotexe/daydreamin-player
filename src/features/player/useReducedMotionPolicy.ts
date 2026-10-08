import { useReducedMotion } from "motion/react";

export interface ReducedMotionPolicy {
  reduce: boolean;
  allowContinuous: boolean;
}

export function useReducedMotionPolicy(): ReducedMotionPolicy {
  const reduce = useReducedMotion() ?? false;

  return {
    reduce,
    allowContinuous: !reduce,
  };
}
