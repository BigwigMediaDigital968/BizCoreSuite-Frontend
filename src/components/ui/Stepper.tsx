import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  /** Zero-based index of the step being shown. */
  current: number;
  /** Called when a finished step is chosen, to go back and edit it. */
  onStepClick: (index: number) => void;
}

/**
 * Progress through a short sequence. Finished steps are buttons that jump
 * back; later steps are only reachable with the form's Next button, so each
 * step is validated on the way.
 */
const Stepper = ({ steps, current, onStepClick }: StepperProps) => (
  <nav aria-label="Progress">
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const status = done ? "completed" : active ? "current" : "upcoming";

        return (
          <li
            key={label}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <button
              type="button"
              disabled={!done}
              onClick={() => onStepClick(i)}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-default"
            >
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-purple-600 text-white"
                    : done
                      ? "border border-purple-600 bg-purple-50 text-purple-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="sr-only">{`Step ${i + 1} of ${steps.length}, ${status}: `}</span>
              <span
                className={`text-sm font-medium ${active ? "" : "hidden sm:inline"} ${
                  active
                    ? "text-slate-900"
                    : done
                      ? "text-purple-700"
                      : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-3 h-px flex-1 ${done ? "bg-purple-400" : "bg-slate-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Stepper;
