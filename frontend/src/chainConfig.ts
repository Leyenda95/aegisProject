// Constantes de la red y del contrato desplegado, sin ningún import pesado.

export const NETWORK_ID = 'preprod';

// Dirección del contrato ya desplegado en preprod (backend/.contract-address-preprod).
// Dato público (cualquiera puede verlo en el indexador), así que fijarlo aquí
// no revela nada que no se pudiera ver ya; evita depender del backend solo
// para saber qué contrato consultar. Si algún día se despliega uno nuevo,
// hay que actualizar esta constante a mano.
export const CONTRACT_ADDRESS = '2f117c9e6be94b7e169625cfc2448b327e7129ad7bbf01ca8ebc17cc88e78b62';
