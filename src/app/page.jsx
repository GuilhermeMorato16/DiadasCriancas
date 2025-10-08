'use client'
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
  createListCollection 
} from "@chakra-ui/react";

import { useState } from "react";
import { HiPlus } from "react-icons/hi2";
import React from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { toaster } from "@/components/ui/toaster";


export default function Home() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null); 
  const [bonus, setBonus] = useState(null); 

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

const handleCadastro = async (e) => {
  e.preventDefault();

  if (isLoading) return;
  setIsLoading(true);

  const cpfLimpo = cpf.replace(/\D/g, "");

  if (!nome || !cpfLimpo || !empresa) {
    toaster.create({
      title: "Campos incompletos",
      description: "Por favor, preencha nome, CPF e empresa.",
      type: "warning",
      duration: 3000,
    });
    setIsLoading(false);
    return;
  }

  try {
    // 🔹 Verifica se o CPF já existe
    const q = query(collection(db, "cadastros"), where("cpf", "==", cpfLimpo));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toaster.create({
        title: "CPF já cadastrado",
        description: "Este CPF já foi usado.",
        type: "error",
      });
      setIsLoading(false);
      return;
    }

    // NOVO: Define valores padrão para o bônus e a imagem
    let imageUrl = null;
    const possuiBonus = imageFile ? true : false;

    // ALTERADO: A lógica de upload só executa se houver uma imagem
    if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const response = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Falha no upload da imagem.");
        }

        const data = await response.json();
        imageUrl = data.imageUrl; // Atribui a URL da imagem
    }
    
    // ALTERADO: Cria o objeto de dados para salvar no Firestore
    const dadosParaSalvar = {
        nomeCompleto: nome.trim(),
        cpf: cpfLimpo,
        empresa: empresa.value,
        possuiBonus: possuiBonus, // Salva se a pessoa tem o bônus ou não
        dataCadastro: new Date(),
    };

    // Adiciona o campo imageUrl apenas se ele existir
    if (imageUrl) {
        dadosParaSalvar.imageUrl = imageUrl;
    }

    // 🔹 Cria o novo cadastro no Firestore
    await addDoc(collection(db, "cadastros"), dadosParaSalvar);

    toaster.create({
      title: "Sucesso!",
      description: "Cadastro realizado com sucesso.",
      type: "success",
    });

    // 🔹 Limpa o formulário
    setNome("");
    setCpf("");
    setEmpresa(null);
    setImageFile(null);
    // Opcional: você pode remover o estado 'bonus' se não for mais usado na UI
    setBonus(null); 
    document.getElementById("file-input").value = "";

  } catch (error) {
    console.error("Erro no cadastro:", error);
    toaster.create({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao realizar o cadastro.",
      type: "error",
    });
  } finally {
    setIsLoading(false);
  }
};
  return (
    <AbsoluteCenter w="full">
      <Box p={6} w="full" maxW="md">
        <form onSubmit={handleCadastro}>
    <fieldset disabled={isLoading}>
          <VStack spacing={8} p={8} borderWidth="1px" borderRadius="lg" shadow="lg">
            <Heading textAlign={"center"} size={"2xl"} fontWeight={600}>FAÇA SEU CADASTRO</Heading>
            <Text textAlign={"center"}>Faça seu cadastro para participar do nosso desafio de dia das crianças!</Text>
            <Input
            type="hidden"
            name=""
            />
                <Input 
                    px={5}
                    id="nome"
                    placeholder="Insira seu nome completo" 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                        mb={5}
                />
                <Input 
                    px={5}
                    mb={5}
                    id="cpf"
                    placeholder="Insira seu CPF"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                />
                <Select.Root 
                    collection={empresas}
                    value={empresa ? [empresa.value] : []}
                    onValueChange={(details) => setEmpresa(details.items[0])}
                    mb={5}
                >
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText placeholder="Selecione sua empresa" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content>
                                {empresas.items.map((empresa) => (
                                    <Select.Item item={empresa} key={empresa.value}>
                                        {empresa.label}
                                        <Select.ItemIndicator />
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Positioner>
                    </Portal>
                </Select.Root>
                <Text textAlign={"center"}>Insira aqui a imagem que você deseja usar para participar do nosso desafio</Text>
                <Input 
                    mb={2}
                    px={5}
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    py={1.5}
                />
                {imageFile && <Text fontSize="sm" mb={10} color="gray.500">Arquivo: {imageFile.name}</Text>}
                        
                <Button 
                    type="submit"
                    size={"lg"}
                    colorScheme="blue"
                    variant="solid" 
                    width={"100%"}
                    disabled={isLoading} 
                    loadingText="Enviando..."
                    spinnerPlacement="start"
                > 
                    <HiPlus style={{ marginRight: '8px' }} /> Fazer cadastro
                </Button>
            </VStack>
            </fieldset>
        </form>
      </Box>
    </AbsoluteCenter>
  );
}

const empresas = createListCollection({
  items: [
    { label: "Simetria Brasil", value: "Simetria" },
    { label: "GCpromotora", value: "GC" }
  ],
})