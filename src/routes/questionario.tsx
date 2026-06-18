import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider } from "@/lib/checkit/store";
import { Questionario } from "@/components/checkit/Questionario";

export const Route = createFileRoute("/questionario")({
  head: () => ({ meta: [{ title: "CheckIt — Questionario" }] }),
  component: QRoute,
});

function QRoute() {
  return (
    <ProfileProvider>
      <PhoneFrame>
        <Questionario />
      </PhoneFrame>
    </ProfileProvider>
  );
}
