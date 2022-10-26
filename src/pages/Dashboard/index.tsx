import React, { useCallback, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';

import {
  FiPower,
  FiEdit,
  FiList,
  FiMinusCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import { Link, useHistory, useLocation } from 'react-router-dom';
import {
  Container,
  Header,
  HeaderContent,
  Profile,
  Schedule,
  Content,
  Project,
  Section,
  TitleContent,
} from './styles';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';
import Button from '../../components/Button';
import { useToast } from '../../hooks/toast';

interface IProject {
  id: string;
  name: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  tasks: ITask[];
}

interface ITask {
  description: string;
  user_id: string;
  project_id: string;
  end_date: Date;
  concluded: boolean;
  id: string;
  created_at: Date;
  updated_at: Date;
}

function removeItem<T>(arr: Array<ITask>, value: string): Array<ITask> {
  const index = arr.findIndex((obj) => obj.id === value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [viewTasks, setViewTasks] = useState<boolean>(false);
  const history = useHistory();
  const { search } = useLocation();

  useEffect(() => {
    api.get<IProject[]>('/projects').then((response) => {
      return setProjects(response.data);
    });
  }, [projects]);

  const handleRemoveProject = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/projects/${id}`);

        const newList = projects.filter((item) => item.id !== id);
        setProjects(newList);

        addToast({
          type: 'success',
          title: 'Projeto excluído com sucesso!',
        });
      } catch (error) {
        let message = 'Ocorreu um erro ao tentar excluir o Projeto.';
        if (error.response) {
          message = error.response.data.message;
        }
        addToast({
          type: 'error',
          title: 'Erro na Exclusão',
          description: message,
        });
      }
    },
    [addToast, projects],
  );

  const handleRemoveTask = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/tasks/${id}`);

        const newProjects = projects.map((project) => {
          project.tasks = removeItem(project.tasks, id);
          return project;
        });
        setProjects(newProjects);

        const newList = tasks.filter((item) => item.id !== id);
        setTasks(newList);

        addToast({
          type: 'success',
          title: 'Tarefa excluído com sucesso!',
        });
      } catch (error) {
        let message = 'Ocorreu um erro ao tentar excluir o Tarefa.';
        if (error.response) {
          message = error.response.data.message;
        }
        addToast({
          type: 'error',
          title: 'Erro na Exclusão',
          description: message,
        });
      }
    },
    [addToast, projects, tasks],
  );

  const handleAddTask = useCallback(async () => {
    const project_id = new URLSearchParams(search).get('project_id');
    localStorage.removeItem('@app:form:task');

    history.push({
      pathname: '/task',
      search: `?project_id=${project_id}`,
    });
  }, [history, search]);

  const handleViewTasks = useCallback(
    async (id: string, newTasks: ITask[]) => {
      history.push({
        pathname: '/dashboard',
        search: `?project_id=${id}`,
      });

      setViewTasks(true);
      setTasks(newTasks);
    },
    [history],
  );

  const handleCloseViewTasks = useCallback(async () => {
    history.push({
      pathname: '/dashboard',
    });

    setViewTasks(false);
    setTasks([]);
  }, [history]);

  const handleSetStorageValuesTask = useCallback(
    async (data: ITask) => {
      localStorage.setItem('@app:form:task', JSON.stringify(data));

      history.push({
        pathname: '/task',
        search: `?project_id=${data.project_id}`,
      });
    },
    [history],
  );

  const handleEditProject = useCallback(
    async (data: IProject) => {
      localStorage.setItem('@app:form:project', JSON.stringify(data));

      history.push({
        pathname: '/project',
        search: `?id=${data.id}`,
      });
    },
    [history],
  );

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Profile>
            <div>
              {viewTasks ? (
                <>
                  <button type="button" onClick={handleCloseViewTasks}>
                    <FiArrowLeft />
                  </button>
                </>
              ) : (
                <>
                  <span>Bem-vindo,</span>
                  <Link to="/profile">
                    <strong>{user.name}</strong>
                  </Link>
                </>
              )}
            </div>
          </Profile>
          <button type="button" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </Header>
      <Content>
        <Schedule>
          {viewTasks ? (
            <>
              <TitleContent>
                <h1>Gerenciamento de Tarefas</h1>
                <div>
                  <Button type="button" onClick={handleAddTask}>
                    Cadastrar nova Tarefa
                  </Button>
                </div>
              </TitleContent>
              <Section>
                {tasks.length === 0 && <p>Nenhuma tarefa encontrada</p>}
                {tasks.map((task) => (
                  <Project key={task.id}>
                    <div>
                      <strong>{task.description}</strong>
                      <div>
                        <button
                          type="button"
                          onClick={() => handleSetStorageValuesTask(task)}
                        >
                          <Link to="/task">
                            <FiEdit />
                          </Link>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                        >
                          <FiMinusCircle />
                        </button>
                      </div>
                    </div>
                  </Project>
                ))}
              </Section>
            </>
          ) : (
            <>
              <TitleContent>
                <h1>Gerenciamento de Projetos</h1>
                <Link to="/project">
                  <Button type="button">Cadastrar novo Projeto</Button>
                </Link>
              </TitleContent>
              <Section>
                {projects.length === 0 && <p>Nenhum projeto encontrado</p>}
                {projects.map((project) => (
                  <Project key={project.id}>
                    <div>
                      <strong>{project.name}</strong>
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handleViewTasks(project.id, project.tasks)
                          }
                        >
                          <FiList />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditProject(project)}
                        >
                          <Link to="/project">
                            <FiEdit />
                          </Link>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(project.id)}
                        >
                          <FiMinusCircle />
                        </button>
                      </div>
                    </div>
                  </Project>
                ))}
              </Section>
            </>
          )}
        </Schedule>
      </Content>
    </Container>
  );
};

export default Dashboard;
