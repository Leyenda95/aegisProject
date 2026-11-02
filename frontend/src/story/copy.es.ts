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
      body: 'Esto es una **demo** sobre **Preprod**, la red de pruebas de Midnight. La tienda y los productos son inventados y las señales no tienen valor real. Lo que sí es real: cada paso es una **transacción de verdad**, con una **prueba de conocimiento cero** que cualquiera puede verificar.',
    },
    problem: {
      title: 'Tus compras tienen dueño, y no eres tú',
      body: 'Cada compra, cada tarjeta de fidelidad, cada clic: intermediarios de datos y grandes plataformas crean **perfiles sobre ti** y los venden al mejor postor. Quien los compra no es el pequeño comercio, que **compite a ciegas**.',
    },
    idea: {
      title: 'Una compra, una señal anónima',
      body: '*Aegis* convierte cada compra en una **señal anónima**: solo se revela lo que el cliente decide. Sumadas, las señales dibujan el mercado; por separado, no dicen nada de nadie.',
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
        'Tu señal sumó a las cifras públicas; el agente solo leyó el conjunto',
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
    disclosure: { title: 'Divulgación selectiva', text: 'Cada cliente decide qué parte de su compra se hace pública; el resto se queda en su móvil.' },
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
      title: 'Conecta tu wallet',
      body: 'Por defecto, *Aegis* patrocina todas las transacciones, así que puedes seguir sin conectar nada. Pero si prefieres una experiencia más tuya, conecta tu wallet y firma tú cada paso.\n\nEn el ordenador, usa la extensión de **Lace** o de **1AM**. Elijas lo que elijas, después podrás empezar a interactuar con el mercado privado de *Aegis*.',
    },
    ribbon: {
      title: 'Las cifras del mercado',
      body: 'Arriba están las **cifras públicas** del mercado: cuántas señales hay en total y en cada categoría. Viven en Midnight y cualquiera puede leerlas y comprobarlas.\n\nSon fruto de lo que los propios consumidores han decidido compartir. Fíjate en el total: dentro de un momento sumará el tuyo.',
    },
    registry: {
      title: 'Una tienda registrada',
      body: 'Solo las tiendas dadas de alta pueden sellar recibos; si no, cualquiera podría inventarse compras. Cada tienda solicita su alta y quien administra el registro la revisa. Si todo es correcto, su **clave pública** entra en un **árbol de Merkle** dentro del contrato.\n\nEl registro vive en la cadena, así que cualquiera puede comprobarlo.',
      todo: 'Pulsa «Comprobar el registro de tiendas»',
    },
    addToCart: {
      title: 'Añade algo a la cesta',
      body: 'Cada producto tiene una **categoría** y una **subcategoría**, por ejemplo Moda › Calzado. Con ellas se dibuja el mercado, sin que nadie sepa quién compró.',
      todo: 'Añade un producto a la cesta',
    },
    charge: {
      title: 'Cobra y sella el recibo',
      body: 'Al cobrar, la tienda publica un **compromiso** del recibo, una huella que no deja ver nada de lo que hay dentro. Con una **prueba ZK** demuestra que es una tienda registrada **sin decir cuál**.\n\nEl recibo en crudo nunca pisa la cadena. Si no has conectado tu wallet, no has pagado comisiones: *Aegis* patrocinó la transacción en segundo plano para que todo fluya.',
      todo: 'Pulsa «Cobrar y generar QR»',
    },
    receipt: {
      title: 'El recibo y su QR',
      body: 'Este es el recibo de la compra, con productos, precios e importe. En Midnight solo está su **compromiso**.\n\nEl QR lleva el recibo entero dentro de un enlace, y ningún servidor llega a verlo. Ahora puedes coger tu móvil y escanearlo para vivir el flujo real, o seguir con la demo aquí.\n\nMás adelante podrás elegir qué información de este recibo compartes.',
    },
    ticket: {
      title: 'El ticket, en tu móvil',
      body: 'Esta es la app de *Aegis*. Guarda los tickets **en tu dispositivo**: no hay cuenta ni servidor que los tenga. El de arriba es el recibo que acabas de crear; el resto son compras anteriores.\n\nDesde el ticket decides si publicas su señal y qué información compartes.',
      todo: 'Pulsa «Publicar señal» en el ticket nuevo',
    },
    share: {
      title: 'Tus datos, tu decisión',
      body: 'La información de tu compra te pertenece. Esto es la **revelación selectiva**: tú decides qué se hace público y qué se queda contigo. Nada de lo que publiques se podrá enlazar con tu persona.\n\nVerás un resumen claro de tu selección. También eliges dónde se genera la prueba: en *Aegis* o en tu propio equipo.',
      todo: 'Publica la señal',
    },
    publish: {
      title: 'La prueba, en marcha',
      body: 'Se genera una **prueba ZK** que demuestra que tu recibo lo selló una tienda registrada y que no se ha usado todavía.\n\nMidnight la verifica y marca el recibo para evitar el doble uso. Por último, suma las unidades a las cifras del mercado.',
      todo: 'Espera a que la señal llegue al agregado',
    },
    market: {
      title: 'Tu señal ya cuenta',
      body: 'En unos segundos, tu señal formará parte de las **cifras públicas**, y el mercado se dibujará con ella. Aquí puedes comparar por periodos y ver las últimas señales en directo.\n\nCualquiera ve que ha llegado una señal más. Nadie sabe que fuiste tú.',
    },
    report: {
      title: 'Una tienda pequeña, con la visión de una grande',
      body: 'Para esto existe todo lo anterior. Con un mercado público y en tiempo real, cualquier tienda puede decidir con datos en lugar de a ciegas.\n\nUn **agente de IA** lee las cifras del mercado y le explica a cada tienda qué está pasando: qué sube, qué baja y qué hacer para vender más. Acciones concretas para su negocio, sin que ningún cliente haya cedido sus datos.\n\nAsí, los pequeños comercios compiten con los grandes y los consumidores siguen siendo dueños de sus datos.',
    },
    explore: {
      title: 'Ahora, por tu cuenta',
      body: 'Ya has visto el recorrido entero. La demo es tuya: haz más compras, cambia qué compartes, prueba el proof server local o mira el mercado.\n\nCuando quieras, el resumen recoge todo lo que has visto.',
    },
  },
};
