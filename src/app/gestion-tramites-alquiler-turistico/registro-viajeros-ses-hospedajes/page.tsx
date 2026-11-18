import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { GuideShell } from "@/components/tramites/GuideShell";
import { TRAMITES_PUBLIC_PREFIX, tramitesIndexable } from "@/domains/tramites/launch";

const PATH = `${TRAMITES_PUBLIC_PREFIX}/registro-viajeros-ses-hospedajes`;
const TITLE = "Registro de viajeros en SES.HOSPEDAJES para viviendas turísticas";
const DESCRIPTION =
  "Qué tiene que comunicar al Ministerio del Interior el propietario de una vivienda turística, en qué plazo, con qué datos y qué multas prevé la ley.";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    noindex: !tramitesIndexable(),
  });
}

export default function GuiaSesHospedajes() {
  return (
    <GuideShell
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      updated="2026-11-18"
      lede="Si alquilas tu vivienda a turistas, aunque sea unas semanas al año, tienes que comunicar a Interior cada reserva y cada entrada de viajeros. Esto es lo que hay que saber."
    >
      <h2>Quién está obligado</h2>
      <p>
        El Real Decreto 933/2021 obliga a quien presta servicios de alojamiento, también a los
        particulares que alquilan una vivienda de uso turístico, a llevar un registro de los
        viajeros y a comunicarlo al Ministerio del Interior. Se aplica desde el 2 de diciembre de
        2024 y la plataforma para hacerlo es SES.HOSPEDAJES.
      </p>
      <p>
        Da igual que anuncies en Booking, en Airbnb o que la reserva te llegue por teléfono. La
        obligación es del titular de la vivienda, no de la plataforma.
      </p>

      <h2>Qué hay que comunicar y en qué plazo</h2>
      <p>Son tres hechos distintos, y cada uno tiene su propio plazo de 24 horas:</p>
      <ul>
        <li>La reserva, desde que se formaliza.</li>
        <li>La anulación, si el huésped cancela.</li>
        <li>La entrada de los viajeros, desde que llegan a la vivienda.</li>
      </ul>
      <p>
        En la práctica, la reserva hay que comunicarla al día siguiente de recibirla como muy tarde,
        aunque la llegada sea dentro de tres meses.
      </p>

      <h2>Qué datos pide Interior</h2>
      <p>De cada viajero (el documento de identidad, a partir de los 14 años):</p>
      <ul>
        <li>Nombre y apellidos, sexo, fecha de nacimiento y nacionalidad.</li>
        <li>Tipo y número de documento, y el número de soporte si es DNI o NIE.</li>
        <li>Dirección completa de residencia, teléfono y correo electrónico.</li>
        <li>Parentesco con el viajero adulto cuando viaja un menor.</li>
      </ul>
      <p>
        De la reserva se comunican, entre otros, las fechas de entrada y salida, el número de
        viajeros y la forma de pago. Los datos se conservan tres años.
      </p>

      <h2>Primero, el alta del establecimiento</h2>
      <p>
        Antes de la primera comunicación hay que darse de alta como arrendador en SES.HOSPEDAJES y
        registrar la vivienda como establecimiento. Sin esa alta no se puede enviar nada. Es un
        trámite de una sola vez por vivienda.
      </p>

      <h2>Qué pasa si no se comunica</h2>
      <p>
        Las infracciones se rigen por la Ley Orgánica 4/2015, de protección de la seguridad
        ciudadana. No llevar el registro o no hacer las comunicaciones puede ser una infracción
        grave, con multas de 601 a 30.000 euros. Comunicar fuera de plazo o con datos incompletos
        puede ser leve, de 100 a 600 euros.
      </p>
      <p>
        Ojo con una idea que circula mucho: presentar tarde una reserva no borra el incumplimiento.
        Queda constancia de la fecha real de envío.
      </p>

      <h2>¿Y si contrato a alguien para que lo haga?</h2>
      <p>
        Puedes autorizar a un tercero para que presente las comunicaciones en tu nombre. La
        responsabilidad sigue siendo tuya, así que lo importante es que quien lo haga se entere de
        cada reserva a tiempo y te deje el justificante de cada envío.
      </p>
      <p>
        Es lo que hacemos en nuestro{" "}
        <Link href={TRAMITES_PUBLIC_PREFIX}>servicio de gestión de trámites</Link>: nos registras la
        reserva en tu carpeta online, la presentamos y te subimos el resguardo oficial.
      </p>

      <h2>Normas citadas</h2>
      <ul>
        <li>
          Real Decreto 933/2021, de 26 de octubre, de obligaciones de registro documental e
          información de las actividades de hospedaje.
        </li>
        <li>Ley Orgánica 4/2015, de 30 de marzo, de protección de la seguridad ciudadana.</li>
      </ul>
    </GuideShell>
  );
}
