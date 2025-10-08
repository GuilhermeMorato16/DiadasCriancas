'use client'

// 1. Imports do React e bibliotecas
import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  Input,
  AbsoluteCenter,
  Text,
  Portal, 
  Select, 
  createListCollection,
} from "@chakra-ui/react";
import { HiPlus } from "react-icons/hi2";
import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { toaster } from "@/components/ui/toaster"; // Supondo que seu toaster Ark UI esteja configurado

// 2. Definição do Componente Principal
export default function Home() {
  // --- Estados do formulário ---
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null); 

  // --- Funções Utilitárias ---

  // ADICIONADO: Função que valida o CPF
  const validaCPF = (cpf) => {
    const cpfLimpo = String(cpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
    return true;
  }

  // ADICIONADO: Função que aplica a máscara ao CPF
  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o 3º dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o 6º dígito
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Adiciona traço antes dos 2 últimos dígitos
      .substring(0, 14); // Limita o tamanho máximo
  };

  // --- Funções de Evento e Lógica ---

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCadastro = (e) => {
    e.preventDefault();

    if (!nome || !cpf || !empresa) {
      toaster.create({
        title: "Campos incompletos",
        description: "Por favor, preencha os campos obrigatórios (*).",
        type: "warning",
      });
      return;
    }

    // CORRIGIDO: Validação do CPF é chamada aqui
    if (!validaCPF(cpf)) {
      toaster.create({
        title: "CPF inválido",
        description: "O número de CPF informado não é válido.",
        type: "error",
      });
      return;
    }

    if (!imageFile) {
      const userConfirmed = window.confirm(
        "Você tem certeza que quer se cadastrar sem foto? Você não receberá o bônus de uma segunda chance no jogo."
      );
      if (!userConfirmed) {
        return; 
      }
    }

    proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const cpfLimpo = cpf.replace(/\D/g, "");

    try {
      const q = query(collection(db, "cadastros"), where("cpf", "==", cpfLimpo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toaster.create({ title: "CPF já cadastrado", type: "error" });
        setIsLoading(false);
        return;
      }

      let imageUrl = null;
      const possuiBonus = imageFile ? true : false;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const response = await fetch("/api/upload-image", { method: "POST", body: formData });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Falha no upload da imagem.");
        }
        const data = await response.json();
        imageUrl = data.imageUrl;
      }
      
      const dadosParaSalvar = {
        nomeCompleto: nome.trim(),
        cpf: cpfLimpo,
        empresa: empresa.value,
        possuiBonus: possuiBonus,
        dataCadastro: new Date(),
      };

      if (imageUrl) {
        dadosParaSalvar.imageUrl = imageUrl;
      }

      await addDoc(collection(db, "cadastros"), dadosParaSalvar);
      toaster.create({ title: "Sucesso!", description: "Cadastro realizado com sucesso.", type: "success" });

      setNome('');
      setCpf('');
      setEmpresa(null);
      setImageFile(null);
      document.getElementById('file-input').value = "";

    } catch (error) {
      console.error("Erro no cadastro:", error);
      toaster.create({ title: "Erro", description: error.message || "Ocorreu um erro no cadastro.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. JSX para renderização do formulário
  return (
    <AbsoluteCenter w="full">
      <Box p={6} w="full" maxW="2xl">
        <form onSubmit={handleCadastro}>
          <fieldset disabled={isLoading}>
            <VStack spacing={6} p={8} borderWidth="1px" borderRadius="lg" shadow="lg">
              <Heading textAlign={"center"} size={{base: "xl", md: "2xl"}} fontWeight={600}>Cadastre-se e desperte a criança que existe em você!</Heading>
              <Text textAlign={"center"} fontSize={{base: "xs", md: "sm"}}>Preencha seus dados e entre para o desafio de Dia das Crianças!
               <br /> Quer <strong>dobrar suas chances de ganhar</strong>? Mostre seu melhor sorriso e envie suas fotos mais criativas!
</Text>
              <Text fontWeight={"800"}>Dados necessários:</Text>
              <Input 
                id="nome"
                placeholder="Nome completo*" 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <Input 
                id="cpf"
                placeholder="CPF*"
                type="text"
                maxLength="14"
                value={cpf}
              // CORRIGIDO: Máscara aplicada no onChange
                onChange={(e) => setCpf(maskCPF(e.target.value))}
            	/>

              <Select.Root 
                width="100%"
                collection={empresas}
                value={empresa ? [empresa.value] : []}
                onValueChange={(details) => setEmpresa(details.items[0])}
            	>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Selecione sua empresa* (escolha entre as empresas participantes)" />
                  </Select.Trigger>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {empresas.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
            	</Select.Root>

              <Text textAlign={"center"} fontSize="sm" fontWeight={700}>Agora é com você!</Text>
              <Text textAlign={"center"} fontSize="sm">Envie sua foto mais fofa, estilosa ou divertida e participe dessa brincadeira cheia de nostalgia e alegria.</Text>
              <Input 
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                p={1.5}
            	/>
              {imageFile && <Text fontSize="xs" color="gray.500">Arquivo: {imageFile.name}</Text>}
              
              <Button 
                type="submit"
                size={"lg"}
                width={"100%"}
                isLoading={isLoading}
                loadingText="Enviando..."
                spinnerPlacement="start"
            	> 
                <HiPlus style={{ marginRight: '8px' }} /> Me cadastrar
            	</Button>
              <Text fontSize={"xs"}>*Ao preencher seus dados, você garante uma chance para participar do quiz e tentar adivinhar quem é o colega por trás da foto. Se você também enviar a sua foto, ganha mais uma oportunidade de responder ao quiz.</Text>
            </VStack>
          </fieldset>
        </form>
      </Box>
    </AbsoluteCenter>
  );
}

// 4. Dados estáticos para o componente
const empresas = createListCollection({
  items: [
    { label: "Simetria Brasil", value: "Simetria" },
    { label: "GCpromotora", value: "GC" }
  ],
});