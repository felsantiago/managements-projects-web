import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  ChangeEvent,
} from 'react';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { useHistory, Link, useLocation } from 'react-router-dom';
import DayPicker, { DayModifiers } from 'react-day-picker';
import api from '../../services/api';
import { useToast } from '../../hooks/toast';

import getValidationErrors from '../../utils/getValidationErrors';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { Container, Content, InputSwitch, Label, Switch } from './styles';
import { Calendar } from '../Dashboard/styles';

interface TaskFormData {
  description: string;
}

interface MonthAvailabilityItem {
  day: number;
  available: boolean;
}

const Task: React.FC = () => {
  const taskStorage = localStorage.getItem('@app:form:task');
  const [checked, setChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    (taskStorage && new Date(JSON.parse(taskStorage).end_date)) || new Date(),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthAvailability, setMonthAvailability] = useState<
    MonthAvailabilityItem[]
  >([]);

  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();
  const { search } = useLocation();
  const project_id = new URLSearchParams(search).get('project_id');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
  };

  const handleSubmit = useCallback(
    async (data: TaskFormData) => {
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          description: Yup.string().required('Descrição obrigatório'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { description } = data;

        if (taskStorage) {
          await api.put(`/tasks/${JSON.parse(taskStorage).id}`, {
            description,
            end_date: selectedDate,
            concluded: checked,
            project_id,
          });
        } else {
          await api.post('/tasks', {
            description,
            end_date: selectedDate,
            project_id,
          });
        }

        addToast({
          type: 'success',
          title: 'Tarefa criado com sucesso!',
        });

        history.push('/dashboard');
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors = getValidationErrors(error);
          formRef.current?.setErrors(errors);

          return;
        }
        addToast({
          type: 'error',
          title: 'Erro no Cadastro',
          description: 'Ocorreu ao tentar cadastrar uma tarefa.',
        });
      }
    },
    [addToast, checked, history, project_id, selectedDate, taskStorage],
  );

  const disabledDays = useMemo(() => {
    return monthAvailability
      .filter((monthDay) => monthDay.available === false)
      .map(({ day }) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month, day);
      });
  }, [currentMonth, monthAvailability]);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);

  const handleDateChange = useCallback((day: Date, modifiers: DayModifiers) => {
    if (modifiers.available && !modifiers.disabled) {
      setSelectedDate(day);
    }
  }, []);

  return (
    <Container>
      <header>
        <div>
          <Link to="/dashboard">
            <FiArrowLeft />
          </Link>
        </div>
      </header>
      <Content>
        <Form ref={formRef} onSubmit={handleSubmit}>
          <h1>Tarefa</h1>

          <Input
            icon={FiFileText}
            placeholder="Descrição"
            name="description"
            defaultValue={taskStorage && JSON.parse(taskStorage).description}
          />

          {taskStorage && (
            <Label>
              <span>Marcar como concluído: </span>
              <InputSwitch
                checked={
                  (taskStorage && JSON.parse(taskStorage).concluded) || checked
                }
                type="checkbox"
                onChange={handleChange}
              />
              <Switch />
            </Label>
          )}

          <Calendar>
            <DayPicker
              weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
              fromMonth={new Date()}
              disabledDays={[
                {
                  daysOfWeek: [0, 6],
                },
                ...disabledDays,
              ]}
              modifiers={{
                available: { daysOfWeek: [1, 2, 3, 4, 5] },
              }}
              onMonthChange={handleMonthChange}
              selectedDays={selectedDate}
              onDayClick={handleDateChange}
              months={[
                'Janeiro',
                'Fevereiro',
                'Março',
                'Abril',
                'Maio',
                'Junho',
                'Julho',
                'Agosto',
                'Setembro',
                'Outubro',
                'Novembro',
                'Dezembro',
              ]}
            />
          </Calendar>
          <Button type="submit">Enviar</Button>
        </Form>
      </Content>
    </Container>
  );
};

export default Task;
