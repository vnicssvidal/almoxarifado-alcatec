'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarCliente } from './supabase';

// carrega o usuário logado e manda de volta pro login se não tiver sessão.
// se a tela não for do perfil dele, manda pra consulta de materiais
export function useSessao(perfisPermitidos) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const supabase = criarCliente();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace('/');
        return;
      }
      const { data: perfil } = await supabase
        .from('usuarios').select('id, nome, perfil').eq('id', data.user.id).single();
      if (!perfil) {
        router.replace('/');
        return;
      }
      if (perfisPermitidos && !perfisPermitidos.includes(perfil.perfil)) {
        router.replace('/materiais');
        return;
      }
      setUsuario(perfil);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return usuario;
}

export function formatarData(valor) {
  if (!valor) return '';
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const NOME_STATUS = {
  solicitado: 'Aguardando separação',
  separado: 'Separado, pode retirar',
  retirado: 'Retirado',
  cancelado: 'Cancelado',
};
