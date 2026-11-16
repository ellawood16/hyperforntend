import { brandConfig } from "@/config/site";
import { useIdentityVerification } from "./useIdentityVerification";
import { AnonIdentityVerification } from "./templates/AnonIdentityVerification";
import { DefaultIdentityVerification } from "./templates/DefaultIdentityVerification";

export function IdentityVerificationPage() {
  const model = useIdentityVerification();
  return brandConfig.style === "anon"
    ? <AnonIdentityVerification model={model} />
    : <DefaultIdentityVerification model={model} />;
}
