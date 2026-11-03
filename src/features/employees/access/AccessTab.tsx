import { Can } from "@/components/Auth/Can";
import { ACCESS_SECTIONS, type AccessSectionProps } from "./accessSections";

/**
 * Per-person access, one card per area. Each card appears only for people
 * allowed to change that area, so the tab grows as ACCESS_SECTIONS does.
 */
const AccessTab = (props: AccessSectionProps) => (
  <div className="space-y-6">
    <p className="font-body-md text-xs text-on-surface-variant">
      What {props.userName} can do. Changes apply straight away.
    </p>

    {ACCESS_SECTIONS.map(
      ({ id, title, description, icon, permission, Component }) => (
        <Can key={id} permission={permission}>
          <section
            id={`access-${id}`}
            aria-labelledby={`access-${id}-title`}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm"
          >
            <header className="mb-5 flex items-start gap-3 border-b border-outline-variant/20 pb-4">
              <span
                aria-hidden="true"
                className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-xl text-primary"
              >
                {icon}
              </span>
              <div>
                <h3
                  id={`access-${id}-title`}
                  className="font-headline-sm text-sm font-bold text-on-surface"
                >
                  {title}
                </h3>
                <p className="text-xs text-on-surface-variant">{description}</p>
              </div>
            </header>
            <Component {...props} />
          </section>
        </Can>
      )
    )}
  </div>
);

export default AccessTab;
