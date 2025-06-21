// src/servicios/servicios.js
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export const obtenerServicios = async () => {
  const snapshot = await getDocs(collection(db, "servicios"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
