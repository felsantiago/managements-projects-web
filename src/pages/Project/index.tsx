import React, { useCallback, useRef } from 'react';
import { FiArrowLeft, FiArchive } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { useHistory, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/toast';

import getValidationErrors from '../../utils/getValidationErrors';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { Container, Content } from './styles';

interface ProfileFormData {
  name: string;
}

const Profile: React.FC = () => {
  const projectStorage = localStorage.getItem('@app:form:project');
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { name } = data;

        const formData = {
          name,
        };

        if (projectStorage) {
          await api.put(`/projects/${JSON.parse(projectStorage).id}`, formData);
        } else {
          await api.post('/projects', formData);
        }

        addToast({
          type: 'success',
          title: 'Projeto criado com sucesso!',
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
          description: 'Ocorreu ao tentar cadastrar um projeto.',
        });
      }
    },
    [addToast, history, projectStorage],
  );

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
          <h1>Projeto</h1>

          <Input
            icon={FiArchive}
            placeholder="Nome"
            name="name"
            defaultValue={projectStorage && JSON.parse(projectStorage).name}
          />

          <Button type="submit">Enviar</Button>
        </Form>
      </Content>
    </Container>
  );
};

export default Profile;
