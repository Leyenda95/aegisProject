import type { StoryCopy } from './copy.ts';

export const storyEs: StoryCopy = {
  ui: {
    backToStart: 'Volver al principio',
    skipIntro: 'Saltar intro',
    repository: 'Repositorio',
    backToDemo: '← Volver a la demo',
    resetToIntro: '↺ Volver a la intro',
    slideOf: (n, total) => `${n} de ${total}`,
    keysHint: 'Usa las flechas del teclado o pulsa para avanzar',
    previous: 'Anterior',
    next: 'Siguiente',
    startJourney: 'Iniciar el recorrido',
    behindTheScenes: 'Detrás de escena',
    back: 'Atrás',
    yourTurn: 'Te toca',
    stepDone: 'Hecho',
    switchToFree: 'Explorar por libre',
    switchToTour: 'Tour guiado',
    exploreFreely: 'Explorar por libre',
    seeRecap: 'Ver el resumen',
    showMore: 'Ver más',
    showLess: 'Ver menos',
  },

  art: { store: 'Tienda', customer: 'Cliente', midnight: 'Midnight', market: 'Mercado', agent: 'Agente IA' },

  intro: {
    welcome: {
      kicker: 'Te damos la bienvenida a',
      title: 'Aegis',
      body: 'Cada compra dice algo de ti. Hoy el producto no es lo que compras: **eres tú**. ¿Y si el mercado pudiera saber **qué se vende** sin saber **quién lo compra**?',
    },
    disclaimer: {
      title: 'Antes de empezar',
      body: 'Esto es una **demo** sobre **Preprod**, la red de pruebas de Midnight. La tienda y los productos son inventados y las señales no tienen valor real. Lo que sí es real: cada paso es una **transacción de verdad**, con una prueba de conocimiento cero que cualquiera puede verificar.',
    },
    problem: {
      title: 'Tus compras tienen dueño, y no eres tú',
      body: 'Cada compra, cada tarjeta de fidelidad, cada clic: intermediarios de datos y grandes plataformas crean **perfiles sobre ti** y los venden al mejor postor. Quien los compra no es el pequeño comercio, que **compite a ciegas**.',
    },
    idea: {
      title: 'Una compra, una señal anónima',
      body: '*Aegis* convierte cada compra en una **señal anónima**: solo se revela lo que el cliente decide. Sumadas, las señales **dibujan el mercado**. Por separado, no dicen nada de nadie.',
    },
    players: {
      title: 'Quién participa',
      body: 'Cinco piezas, cada una con su papel y sin ver más de lo que necesita.',
      items: [
        { title: 'Tienda', text: 'Cobra y sella el recibo. Demuestra que es una tienda registrada sin mostrar su identidad.' },
        { title: 'Cliente', text: 'Guarda sus tickets en el móvil y decide cuándo publicar la señal y qué se publica.' },
        { title: 'Midnight', text: 'Ejecuta el contrato y verifica las pruebas. Guarda el registro de tiendas y los contadores públicos.' },
        { title: 'Mercado público', text: 'Cualquiera puede ver lo que ocurre en el mercado en tiempo real.' },
        { title: 'Agente de IA', text: 'Lee solo las señales anónimas y escribe un informe personalizado para cada tienda.' },
      ],
    },
    flow: {
      title: 'Cómo viaja una compra',
      body: 'De la tienda al mercado en cinco pasos.',
      steps: [
        'La tienda cobra y sella el recibo: publica un compromiso y demuestra que está en el árbol de forma anónima.',
        'El cliente recibe el recibo en un QR y lo guarda en su móvil. El recibo completo nunca va a la cadena.',
        'Cuando quiere, el cliente publica la señal: una prueba ZK de que su recibo está sellado y sin usar. Él decide qué revelar.',
        'El contrato marca el recibo como usado y suma las unidades a los datos públicos.',
        'El agente lee los datos públicos y hace un resumen del mercado en tiempo real.',
      ],
    },
    publicPrivate: {
      title: 'Qué es público y qué no',
      body: 'Lo que cualquiera puede ver en la cadena, y lo que nunca sale de tu móvil.',
      columns: [
        {
          title: 'Público en Midnight',
          items: [
            'Una tienda registrada selló un recibo, sin decir cuál',
            'El compromiso del recibo',
            'La información de cada recibo que el cliente decide publicar',
            'Los contadores de cada categoría',
          ],
        },
        {
          title: 'Solo en tu móvil',
          items: [
            'El recibo completo: productos, importe, tarjeta, etc.',
            'La tienda en la que compraste',
            'Tu perfil de compra',
            'La propiedad de tus datos',
          ],
        },
      ],
    },
    builtWith: {
      title: 'Construido sobre Midnight',
      body: '*Aegis* usa la infraestructura de Midnight para que la privacidad la garantice la criptografía, y no una promesa.',
    },
    mission: {
      title: 'Tu misión en esta demo',
      body: 'Vas a hacer una compra en la tienda de la demo y a convertirla en una **señal anónima**. Por el camino verás qué pasa detrás de cada paso.',
    },
    ready: {
      title: '¿Empezamos?',
      body: 'La demo guiada arranca por tu wallet de Midnight y avanza sola a medida que completas cada paso.',
    },
  },

  recap: {
    experienced: {
      title: 'Lo que acabas de hacer',
      body: 'Has convertido una compra en dato de mercado sin dar tus datos. Así, los pequeños comercios compiten con los grandes y tú conservas la propiedad de tu información:',
      steps: [
        'Conectaste tu wallet, o usaste el patrocinio de *Aegis*',
        'Comprobaste en Midnight que la tienda está registrada',
        'La tienda selló tu recibo sin decir cuál es',
        'Te llevaste el ticket al móvil con un QR',
        'Elegiste qué compartir y una prueba ZK publicó la señal',
        'Tu señal sumó a las cifras públicas, y el agente solo leyó el conjunto',
      ],
    },
    beyond: {
      title: 'Más allá del comercio',
      body: 'La compra es solo el ejemplo. La misma idea sirve donde haga falta **contar sin vigilar**: un emisor registrado sella un hecho y la persona decide cuándo publicarlo y qué compartir. Encuestas, transporte público o asistencia a eventos.',
    },
    pieces: {
      title: 'Construido sobre Midnight',
      body: 'Lo que *Aegis* usa de Midnight, y dónde leer más.',
    },
    start: {
      title: 'Sigue por tu cuenta',
      body: 'El código es abierto. Puedes desplegar tu propio contrato y probarlo tú mismo.',
    },
  },

  stackGroups: ['Midnight', 'Herramientas'],
  stack: {
    compact: { title: 'Compact', text: 'El lenguaje del contrato: los circuitos que prueban cada paso y los contadores públicos.' },
    proofServer: { title: 'Proof server', text: 'Genera las pruebas de conocimiento cero, en *Aegis* o en tu propio equipo.' },
    disclosure: { title: 'Revelación selectiva', text: 'Cada cliente decide qué parte de su compra se hace pública. El resto se queda en su móvil.' },
    indexer: { title: 'Indexer', text: 'Lee el estado público del contrato y sigue cada transacción en directo.' },
    dust: { title: 'Comisiones patrocinadas', text: 'El recurso con el que se pagan las comisiones. Aquí puede pagarlas *Aegis* por ti.' },
    midnightJs: { title: 'Midnight.js', text: 'El SDK con el que se construyen, prueban y envían las transacciones.' },
    wallets: { title: 'Lace y 1AM', text: 'Wallets de Midnight: firman y pagan desde el navegador con el DApp Connector.' },
  },

  mission: {
    buy: { title: 'Compra', text: 'en la caja de la tienda' },
    scan: { title: 'Recibe el ticket', text: 'en tu móvil, con un QR' },
    choose: { title: 'Elige qué compartir', text: 'y publica la señal' },
    watch: { title: 'Mira el mercado', text: 'con tu compra dentro' },
  },

  resources: {
    repo: { title: 'Repositorio', text: 'El código de *Aegis*: el contrato, el backend y esta web.' },
    docs: { title: 'Documentación de Midnight', text: 'Compact, pruebas ZK y cómo construir sobre Midnight.' },
    contact: { title: 'Contacto', text: 'alvaro@tricubo.tech' },
  },

  tour: {
    wallet: {
      title: 'Conecta tu wallet (opcional)',
      body: 'Vas a seguir una compra desde la caja de una tienda hasta el mercado público, y cada paso será una **transacción real** en Midnight.\n\nPuedes firmarlas tú con **Lace** o **1AM** desde el ordenador, o seguir sin conectar nada: *Aegis* paga las comisiones por ti.',
    },
    ribbon: {
      title: 'Las cifras del mercado',
      body: 'Estas son las **cifras públicas** del mercado. Viven en Midnight y cualquiera puede leerlas y comprobarlas.\n\nDetrás no hay nombres ni recibos, solo lo que cada cliente decidió compartir. Fíjate en el total: al final del recorrido, tu compra sumará una más.',
    },
    registry: {
      title: 'Un registro de confianza',
      body: 'Si cualquiera pudiera sellar recibos, cualquiera podría inventarse compras y falsear el mercado. Por eso las tiendas se dan de alta, y su **clave pública** entra en un **árbol de Merkle**, una lista compacta guardada en el contrato.\n\nAsí, cada pequeño comercio sabe que las cifras que consulta salen de compras de verdad.',
      todo: 'Pulsa «Comprobar registro»',
    },
    addToCart: {
      title: 'Añade algo a la cesta',
      body: 'Todo empieza como siempre: alguien compra algo. Cada producto lleva una **categoría** y una **subcategoría**, por ejemplo Moda › Calzado.\n\nEso es lo mínimo que llegará al mercado, y basta para saber qué se vende. Al publicar, el cliente podrá añadir más, como su franja de edad o lo que gastó, a cambio de ofertas de las tiendas.',
      todo: 'Añade un producto a la cesta',
    },
    charge: {
      title: 'La tienda emite el recibo',
      body: 'Al cobrar, la tienda no sube el recibo a la cadena. Publica un **compromiso**: un sobre cerrado que prueba que el recibo existe, sin dejar ver lo que hay dentro.\n\nA la vez, con una **prueba ZK**, demuestra que está en el registro **sin decir qué tienda es**. Midnight lo comprueba y el sobre queda sellado.',
      todo: 'Pulsa «Cobrar y generar QR»',
    },
    receipt: {
      title: 'El recibo viaja contigo',
      body: 'El recibo completo no está en ninguna base de datos. Viaja dentro de este **QR**, y ningún servidor llega a leerlo.\n\nEscanéalo con tu móvil para vivir el flujo real, o sigue aquí. En los dos casos el recibo ya es tuyo, y más adelante elegirás qué información de él quieres compartir.',
    },
    ticket: {
      title: 'El ticket, en tu móvil',
      body: 'La app de *Aegis* guarda los tickets **solo en tu dispositivo**, sin cuenta ni servidor detrás. Arriba está el que acabas de recibir. Debajo, tus compras anteriores.\n\nLa tienda ya ha sellado el sobre. Ahora decides tú qué hacer con él.',
      todo: 'Pulsa «Publicar señal» en el ticket nuevo',
    },
    share: {
      title: 'Tus datos, tu decisión',
      body: 'Hoy, otros deciden qué se sabe de tus compras. Aquí decides **tú**, y lo que no quieras compartir se queda contigo.\n\nEs la **revelación selectiva**: nadie podrá construir un perfil sobre ti a tus espaldas. Cuanto más compartas, mejores ofertas recibirás. Las tiendas sabrán **qué te gusta**, pero nunca **quién eres**.',
      todo: 'Publica la señal',
    },
    publish: {
      title: 'La prueba, en marcha',
      body: 'A Midnight no llega tu recibo, sino una **prueba ZK**: lo selló una tienda registrada y nadie lo ha usado todavía. Midnight la verifica sin ver nada más.\n\nDespués marca ese sobre como usado, para evitar el doble uso, y suma tu compra a las cifras del mercado.',
      todo: 'Espera a que la señal llegue al agregado',
    },
    market: {
      title: 'Tu señal ya cuenta',
      body: 'En unos segundos, tu señal formará parte de las **cifras públicas**, y el mercado se dibujará con ella. Aquí puedes comparar por periodos y ver las últimas señales en directo.\n\nCualquiera ve que ha llegado una señal más. Nadie sabe que fuiste tú. Y una tienda pequeña, en algún sitio, sabe un poco mejor qué vender.',
    },
    report: {
      title: 'Una tienda pequeña, con la visión de una grande',
      body: 'Para esto sirve todo lo anterior. Un **agente de IA** lee las cifras públicas y le explica a cada tienda qué sube, qué baja y qué hacer para vender más.\n\nLo que antes solo podían permitirse las grandes cadenas, ahora está al alcance de cualquier tienda. Y sin que ningún cliente renuncie a su privacidad.',
    },
    explore: {
      title: 'Ahora, por tu cuenta',
      body: 'Ya has seguido el recorrido completo. Ahora la demo es tuya: haz más compras, cambia qué compartes, genera la prueba en tu equipo o mira cómo se mueve el mercado.\n\nCuando quieras, el resumen repasa todo lo que has visto.',
    },
  },
};
