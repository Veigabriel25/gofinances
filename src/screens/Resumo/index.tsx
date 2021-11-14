import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { VictoryPie } from 'victory-native';

import { useFocusEffect } from '@react-navigation/core';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useTheme } from 'styled-components';

import { ptBR } from 'date-fns/locale';
import { addMonths, subMonths, format } from 'date-fns';

import { categories } from '../../utils/categories';

import {
  Container,
  Header,
  Title,
  Content,
  ChartContainer,
  MonthSelect,
  MonthSelectButton,
  MonthSelectIcon,
  Month,
  LoadContainer,
} from './styles';
import { HistoryCard } from '../../components/HistoryCard';
import { useAuth } from '../../hooks/auth';

interface TransactionData {
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryTotals {
  name: string;
  color: string;
  key: string;
  total: number;
  totalFormatted: string;
  percent: string;
}

export function Resume() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalByCategory, setTotalByCategory] = useState<CategoryTotals[]>([]);

  const theme = useTheme();

  const { user } = useAuth();

  const dataKey = `@gofinances:transactions_user:${user.id}`;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  function handleDateChange(action: 'next' | 'prev') {
    if (action === 'next') {
      setSelectedDate(addMonths(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  }

  async function loadData() {
    setIsLoading(true);
    const response = await AsyncStorage.getItem(dataKey);
    const responseFormatted: TransactionData[] = response
      ? JSON.parse(response)
      : [];

    const expensives = responseFormatted.filter(
      (transaction) =>
        transaction.type === 'negative' &&
        new Date(transaction.date).getMonth() === selectedDate.getMonth() &&
        new Date(transaction.date).getFullYear() === selectedDate.getFullYear()
    );

    const expensivesTotal = expensives.reduce(
      (acc: number, transaction: TransactionData) =>
        acc + Number(transaction.amount),
      0
    );

    const totalByCategory: CategoryTotals[] = [];

    categories.forEach((category) => {
      let categorySum = 0;

      expensives.forEach((expensive) => {
        if (expensive.category === category.key) {
          categorySum += Number(expensive.amount);
        }
      });

      const percent = `${((categorySum / expensivesTotal) * 100).toFixed(0)}%`;

      if (categorySum > 0)
        totalByCategory.push({
          ...category,
          totalFormatted: categorySum.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          total: categorySum,
          percent,
        });
    });

    setTotalByCategory(totalByCategory);
    setIsLoading(false);
  }

  return (
    <Container>
      <Header>
        <Title>Resumo por categoria</Title>
      </Header>

      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadContainer>
      ) : (
        <Content
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: useBottomTabBarHeight(),
          }}
          showsVerticalScrollIndicator={false}
        >
          <MonthSelect>
            <MonthSelectButton onPress={() => handleDateChange('prev')}>
              <MonthSelectIcon name="chevron-left" />
            </MonthSelectButton>
            <Month>
              {format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}
            </Month>
            <MonthSelectButton onPress={() => handleDateChange('next')}>
              <MonthSelectIcon name="chevron-right" />
            </MonthSelectButton>
          </MonthSelect>

          <ChartContainer>
            <VictoryPie
              data={totalByCategory}
              x="percent"
              y="total"
              colorScale={totalByCategory.map((category) => category.color)}
              style={{
                labels: {
                  fontSize: RFValue(18),
                  fontWeight: 'bold',
                  fill: theme.colors.shape,
                },
              }}
              labelRadius={50}
            />
          </ChartContainer>

          {totalByCategory.map((category) => (
            <HistoryCard
              key={category.key}
              title={category.name}
              amount={category.totalFormatted}
              color={category.color}
            />
          ))}
        </Content>
      )}
    </Container>
  );
}
