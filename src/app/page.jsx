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
import { collection, addDoc } from "firebase/firestore";
import { toaster } from "@/components/ui/toaster";

export default function Home() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null); 

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (!nome || !cpf|| !empresa) {
      toaster.create({
        title: "Campos incompletos",
        description: "Por favor, preencha todos os campos e selecione uma imagem.",
        type: "warning",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha no upload da imagem.');
      }

      const data = await response.json();
      const { imageUrl } = data; 

      await addDoc(collection(db, "cadastros"), {
        nomeCompleto: nome,
        cpf: cpf,
        imageUrl: imageUrl, 
        empresa: empresa.value,
        dataCadastro: new Date(),
      });

      toaster.create({
        title: "Sucesso!",
        description: "Cadastro realizado com sucesso.",
        type: "success",
        duration: 3000,
      });

      // Limpar campos
      setNome('');
      setCpf('');
      setEmpresa(null);
      setImageFile(null);
      document.getElementById('file-input').value = '';

    } catch (error) {
      console.error("Erro no cadastro: ", error);
      toaster.create({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao realizar o cadastro.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AbsoluteCenter w="full">
      <Box p={6} w="full" maxW="md">
        <form onSubmit={handleCadastro}>
          <VStack spacing={8} p={8} borderWidth="1px" borderRadius="lg" shadow="lg">
    <Heading size={"2xl"} fontWeight={600}>FAÇA SEU CADASTRO</Heading>
    <Text textAlign={"center"}>Fazendo o seu cadastro você ganha mais uma chance de participar!</Text>
    
    <Input 
        px={5}
        id="nome"
        placeholder="Insira seu nome completo" 
        type="text" 
        value={nome}
        onChange={(e) => setNome(e.target.value)}
            mb={10}
    />

    <Input 
        px={5}
        mb={10}
        id="cpf"
        placeholder="Insira seu CPF"
        type="text"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
    />
    
    {/* Props formatadas para melhor leitura e px={5} movido para o lugar certo */}
    <Select.Root 
        collection={empresas}
        value={empresa ? [empresa.value] : []}
        onValueChange={(details) => setEmpresa(details.items[0])}
        mb={10}
    >
        <Select.HiddenSelect />
        <Select.Control>
            <Select.Trigger>
                {/* px={5} removido daqui */}
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
    <Text>Insira aqui a imagem que você deseja usar para participar do nosso desafio</Text>
    <Input 
        mb={10}
        px={5}
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        py={1.5}
    />
    {imageFile && <Text fontSize="sm" mt={2} color="gray.500">Arquivo: {imageFile.name}</Text>}
            
    <Button 
        type="submit"
        size={"lg"}
        colorScheme="blue"
        variant="solid" 
        width={"100%"}
        isLoading={isLoading}
        loadingText="Enviando..."
        spinnerPlacement="start"
    > 
        <HiPlus style={{ marginRight: '8px' }} /> Fazer cadastro
    </Button>
</VStack>
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