import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Pedido, EstadoPedido } from '../types';
import { CATALOGO_REAL } from '../components/CatalogoModelos';

export function useFirebaseSync(
  localPedidos: Pedido[], 
  setLocalPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>,
  localVentas: Record<string, number>,
  setLocalVentas: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  localCustomModels: string[],
  setLocalCustomModels: React.Dispatch<React.SetStateAction<string[]>>
) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

  // Sign In with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("No se pudo iniciar sesión con Google. Por favor, intente de nuevo.");
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setIsSynced(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync logic
  useEffect(() => {
    if (!user) {
      setIsSynced(false);
      return;
    }

    let unsubPedidos: () => void;
    let unsubVentas: () => void;
    let unsubCustom: () => void;

    const setupSync = async () => {
      try {
        // --- 1. Sync Pedidos ---
        const pedidosCol = collection(db, 'pedidos');
        unsubPedidos = onSnapshot(pedidosCol, async (snapshot) => {
          if (snapshot.empty) {
            // Seed Firestore with local/default data if remote collection is empty
            const batch = writeBatch(db);
            const itemsToSeed = localPedidos.length > 0 ? localPedidos : [];
            if (itemsToSeed.length > 0) {
              console.log(`Seeding ${itemsToSeed.length} pedidos to Firestore...`);
              itemsToSeed.forEach((p) => {
                const docRef = doc(db, 'pedidos', p.id);
                batch.set(docRef, p);
              });
              await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'pedidos'));
            }
          } else {
            const remotePedidos: Pedido[] = [];
            snapshot.forEach((doc) => {
              remotePedidos.push(doc.data() as Pedido);
            });
            // Sort by code/id if desired, or keep as is
            setLocalPedidos(remotePedidos);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'pedidos');
        });

        // --- 2. Sync VentasTienda ---
        const ventasCol = collection(db, 'ventasTienda');
        unsubVentas = onSnapshot(ventasCol, async (snapshot) => {
          if (snapshot.empty) {
            // Seed with local sales if empty
            const batch = writeBatch(db);
            const keys = Object.keys(localVentas);
            if (keys.length > 0) {
              console.log(`Seeding ${keys.length} ventas to Firestore...`);
              keys.forEach((model) => {
                const cleanId = model.trim().toUpperCase().replace(/[^A-Za-z0-9_-]/g, '_');
                if (cleanId) {
                  const docRef = doc(db, 'ventasTienda', cleanId);
                  batch.set(docRef, { modelo: model, pares: localVentas[model] });
                }
              });
              await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'ventasTienda'));
            }
          } else {
            const remoteVentas: Record<string, number> = {};
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.modelo) {
                remoteVentas[data.modelo] = Number(data.pares) || 0;
              }
            });
            setLocalVentas(remoteVentas);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'ventasTienda');
        });

        // --- 3. Sync CustomModels ---
        const customCol = collection(db, 'customModels');
        unsubCustom = onSnapshot(customCol, async (snapshot) => {
          if (snapshot.empty) {
            // Seed custom models if empty
            const savedCustom = localStorage.getItem('zapato_custom_models_expanded');
            if (savedCustom) {
              try {
                const parsed = JSON.parse(savedCustom);
                const batch = writeBatch(db);
                const entries = Object.entries(parsed);
                if (entries.length > 0) {
                  console.log(`Seeding ${entries.length} custom models to Firestore...`);
                  entries.forEach(([modelName, variants]) => {
                    const cleanId = modelName.trim().toUpperCase().replace(/[^A-Za-z0-9_-]/g, '_');
                    if (cleanId) {
                      const docRef = doc(db, 'customModels', cleanId);
                      batch.set(docRef, { modelo: modelName, variants });
                    }
                  });
                  await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'customModels'));
                }
              } catch (e) {
                console.error("Error seeding custom models", e);
              }
            }
          } else {
            const remoteCustomList: string[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.modelo) {
                remoteCustomList.push(data.modelo);
                CATALOGO_REAL[data.modelo.toUpperCase()] = (data.variants || []) as any[];
              }
            });
            setLocalCustomModels(remoteCustomList);
            // Sync with local storage too for fallback compatibility
            const customModelsMap: Record<string, any> = {};
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.modelo) {
                customModelsMap[data.modelo] = data.variants || [];
              }
            });
            localStorage.setItem('zapato_custom_models_expanded', JSON.stringify(customModelsMap));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'customModels');
        });

        setIsSynced(true);
      } catch (err) {
        console.error("Error setting up Firebase listeners", err);
      }
    };

    setupSync();

    return () => {
      if (unsubPedidos) unsubPedidos();
      if (unsubVentas) unsubVentas();
      if (unsubCustom) unsubCustom();
    };
  }, [user]);

  // Operations to expose
  const addOrUpdatePedido = async (p: Pedido) => {
    if (user) {
      try {
        await setDoc(doc(db, 'pedidos', p.id), p);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `pedidos/${p.id}`);
      }
    } else {
      setLocalPedidos(prev => {
        const index = prev.findIndex(item => item.id === p.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = p;
          return updated;
        } else {
          return [p, ...prev];
        }
      });
    }
  };

  const deletePedido = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'pedidos', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `pedidos/${id}`);
      }
    } else {
      setLocalPedidos(prev => prev.filter(p => p.id !== id));
    }
  };

  const updateVenta = async (modelo: string, pares: number) => {
    if (user) {
      try {
        const cleanId = modelo.trim().toUpperCase().replace(/[^A-Za-z0-9_-]/g, '_');
        if (cleanId) {
          await setDoc(doc(db, 'ventasTienda', cleanId), { modelo, pares });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `ventasTienda/${modelo}`);
      }
    } else {
      setLocalVentas(prev => ({
        ...prev,
        [modelo]: pares
      }));
    }
  };

  const addCustomModel = async (modelo: string, variants: any[]) => {
    const cleanName = modelo.toUpperCase();
    if (user) {
      try {
        const cleanId = cleanName.trim().replace(/[^A-Za-z0-9_-]/g, '_');
        if (cleanId) {
          await setDoc(doc(db, 'customModels', cleanId), { modelo: cleanName, variants });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `customModels/${cleanName}`);
      }
    } else {
      // Local fallback
      try {
        const saved = localStorage.getItem('zapato_custom_models_expanded') || '{}';
        const parsed = JSON.parse(saved);
        parsed[cleanName] = variants;
        localStorage.setItem('zapato_custom_models_expanded', JSON.stringify(parsed));
        CATALOGO_REAL[cleanName] = variants;
        setLocalCustomModels(prev => Array.from(new Set([...prev, cleanName])));
      } catch (e) {
        console.error("Local addCustomModel error", e);
      }
    }
  };

  return {
    user,
    loading,
    isSynced,
    loginWithGoogle,
    logout,
    addOrUpdatePedido,
    deletePedido,
    updateVenta,
    addCustomModel
  };
}
