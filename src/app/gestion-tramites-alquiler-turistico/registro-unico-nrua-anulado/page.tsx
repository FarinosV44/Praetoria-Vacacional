import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { GuideShell } from "@/components/tramites/GuideShell";
import { TRAMITES_PUBLIC_PREFIX, tramitesIndexable } from "@/domains/tramites/launch";

const PATH = `${TRAMITES_PUBLIC_PREFIX}/registro-unico-nrua-anulado`;
const TITLE = "Registro Único de Arrendamientos (NRUA), anulado por el Supremo";
const DESCRIPTION =
  "El Tribunal Supremo anuló en 2026 el Registro Único de Arrendamientos y el depósito anual. Qué significa para tu vivienda turística y qué obligaciones siguen vigentes.";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    noindex: !tramitesIndexable(),
  });
}

export default function GuiaNrua() {
  return (
    <GuideShell
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      updated="2026-11-18"
      lede="Durante 2025 hubo que pedir un número de registro único para anunciar la vivienda en las plataformas. En 2026 el Supremo lo anuló. Esto es lo que ha cambiado y lo que no."
    >
      <h2>Qué era el Registro Único</h2>
      <p>
        El Real Decreto 1312/2024 creó un procedimiento estatal para obtener un número de registro
        único (NRUA) para cada vivienda de alquiler de corta duración, a través del Colegio de
        Registradores. Con ese número había que anunciarse en las plataformas, y cada año había que
        presentar un depósito con la información de los arrendamientos.
      </p>

      <h2>Qué anuló el Supremo</h2>
      <p>
        La sentencia 620/2026 del Tribunal Supremo anuló el procedimiento del Registro Único y la
        obligación de información periódica (los artículos 9 y 10 del Real Decreto 1312/2024). El
        fallo se publicó en el BOE el 8 de junio de 2026.
      </p>
      <p>
        En la práctica: hoy no hay que pedir el NRUA ni renovarlo, y no hay depósito anual que
        presentar ante los Registradores. Por eso no lo ofrecemos ni lo cobramos.
      </p>

      <h2>Qué sigue vigente</h2>
      <ul>
        <li>
          El registro de viajeros en SES.HOSPEDAJES (Real Decreto 933/2021). Nada de la sentencia lo
          toca: cada reserva y cada entrada se siguen comunicando en 24 horas. Lo explicamos en la{" "}
          <Link href={`${TRAMITES_PUBLIC_PREFIX}/registro-viajeros-ses-hospedajes`}>
            guía de SES.HOSPEDAJES
          </Link>
          .
        </li>
        <li>
          El registro turístico de tu comunidad autónoma, que es el que habilita para comercializar
          la vivienda.
        </li>
        <li>Las normas de tu ayuntamiento y de tu comunidad de propietarios.</li>
      </ul>

      <h2>¿Y el Real Decreto-ley de octubre?</h2>
      <p>
        El Real Decreto-ley 29/2026, de 6 de octubre, no ha recreado el Registro Único. Pide que los
        anuncios incluyan el número de identificación de la vivienda cuando exista. Revisa que tus
        anuncios muestren el número del registro autonómico y que ya no remitan a un NRUA que no
        hace falta.
      </p>

      <h2>Qué hacer si ya tenías NRUA</h2>
      <p>
        No tienes que hacer nada ante los Registradores. Si tus anuncios lo muestran, puedes
        sustituirlo por el número del registro turístico autonómico. Y si pagaste a alguien por un
        depósito anual que ya no se exige, pregúntale qué ha presentado.
      </p>
      <p>
        Si una norma nueva recupera el registro, lo actualizaremos aquí y avisaremos a nuestros
        clientes.
      </p>

      <h2>Normas citadas</h2>
      <ul>
        <li>
          Real Decreto 1312/2024, de 23 de diciembre (procedimiento de Registro Único de
          Arrendamientos).
        </li>
        <li>Sentencia del Tribunal Supremo 620/2026 (BOE de 8 de junio de 2026).</li>
        <li>Real Decreto-ley 29/2026, de 6 de octubre.</li>
        <li>Real Decreto 933/2021, de 26 de octubre (registro de viajeros).</li>
      </ul>
    </GuideShell>
  );
}
