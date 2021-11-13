import React, { useState } from 'react';

import { Alert, Keyboard, Modal, TouchableWithoutFeedback } from 'react-native';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';

import { Input } from '../../components/Form/Input';
import { Button } from '../../components/Form/Button';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelect } from '../CategorySelect';
import {
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionsTypes,
} from './styles';
import { InputForm } from '../../components/Form/InputForm';

interface FormData {
  name: string;
  amount: string;
}

const schema = Yup.object({
  name: Yup.string().required('Nome é obrigatório'),
  amount: Yup.number()
    .typeError('Informe um valor númerico')
    .positive('O valor não pode ser negativo')
    .required('Valor é obrigatório'),
});

export function Register() {
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria',
  });

  const dataKey = '@gofinances:transactions';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const navigation: NavigationProp<ParamListBase> = useNavigation();

  function handleTransactionTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: FormData) {
    if (!transactionType) return Alert.alert('Selecione o tipo da transação');

    if (category.key === 'category')
      return Alert.alert('Selecione a categoria');

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date(),
    };

    try {
      const data = await AsyncStorage.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : [];

      const dataFormatted = [...currentData, newTransaction];

      await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));
      reset();

      setTransactionType('');
      setCategory({
        key: 'category',
        name: 'Categoria',
      });

      navigation.navigate('Listagem');
    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível salvar');
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm
              placeholder="Nome"
              control={control}
              name="name"
              autoCapitalize="sentences"
              autoCorrect={false}
              error={errors.name && errors.name.message}
            />
            <InputForm
              placeholder="Preço"
              control={control}
              name="amount"
              keyboardType="numeric"
              error={errors.amount && errors.amount.message}
            />

            <TransactionsTypes>
              <TransactionTypeButton
                isActive={transactionType === 'positive'}
                title="Income"
                type="up"
                onPress={() => handleTransactionTypeSelect('positive')}
              />
              <TransactionTypeButton
                isActive={transactionType === 'negative'}
                title="Outcome"
                type="down"
                onPress={() => handleTransactionTypeSelect('negative')}
              />
            </TransactionsTypes>

            <CategorySelectButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>

          <Button title="Enviar" onPress={handleSubmit(handleRegister)} />
        </Form>

        <Modal visible={categoryModalOpen}>
          <CategorySelect
            category={category}
            setCategory={setCategory}
            closeSelectCategory={handleCloseSelectCategoryModal}
          />
        </Modal>
      </Container>
    </TouchableWithoutFeedback>
  );
}
