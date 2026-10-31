/* eslint-disable react/prop-types */
import { Stack } from "@mui/material";

import BillEstimator from "./BillEstimator";
import ConsumptionImport from "./ConsumptionImport";
import SocialBonusCheck from "./SocialBonusCheck";
import RegulatedPrices from "./RegulatedPrices";

/**
 * Factura: lo que un hogar paga de verdad por la luz (no solo el precio de la
 * hora) y si podría pagar menos: con otra tarifa, con el bono social o
 * moviendo consumo. El consumo importado vive en App para no perderlo al
 * cambiar de pestaña.
 */
export function BillTab({ usage, onUsage }) {
  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <BillEstimator usage={usage} />
      <ConsumptionImport usage={usage} onUsage={onUsage} />
      <SocialBonusCheck />
      <RegulatedPrices />
    </Stack>
  );
}

export default BillTab;
