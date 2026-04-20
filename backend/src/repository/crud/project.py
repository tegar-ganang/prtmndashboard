import typing

import sqlalchemy
from sqlalchemy.sql import functions as sqlalchemy_functions

from src.models.db.project import Project
from src.models.schemas.project import ProjectInCreate, ProjectInUpdate
from src.repository.crud.base import BaseCRUDRepository
from src.utilities.exceptions.database import EntityDoesNotExist


class ProjectCRUDRepository(BaseCRUDRepository):
    async def create_project(self, owner_account_id: str, project_create: ProjectInCreate) -> Project:
        new_project = Project(owner_account_id=owner_account_id, **project_create.dict())
        self.async_session.add(instance=new_project)
        await self.async_session.commit()
        await self.async_session.refresh(instance=new_project)

        return new_project

    async def read_projects(self, owner_account_id: str) -> typing.Sequence[Project]:
        stmt = sqlalchemy.select(Project).where(Project.owner_account_id == owner_account_id).order_by(Project.id)
        query = await self.async_session.execute(statement=stmt)
        return query.scalars().all()

    async def read_project_by_id(self, project_id: str, owner_account_id: str) -> Project:
        stmt = sqlalchemy.select(Project).where(Project.id == project_id, Project.owner_account_id == owner_account_id)
        query = await self.async_session.execute(statement=stmt)
        db_project = query.scalar()

        if not db_project:
            raise EntityDoesNotExist(f"Project with id `{project_id}` does not exist!")

        return db_project

    async def update_project_by_id(
        self, project_id: str, owner_account_id: str, project_update: ProjectInUpdate
    ) -> Project:
        update_data = {k: v for k, v in project_update.dict().items() if v is not None}

        db_project = await self.read_project_by_id(project_id=project_id, owner_account_id=owner_account_id)

        update_stmt = (
            sqlalchemy.update(table=Project)
            .where(Project.id == db_project.id, Project.owner_account_id == owner_account_id)
            .values(updated_at=sqlalchemy_functions.now(), **update_data)
        )

        await self.async_session.execute(statement=update_stmt)
        await self.async_session.commit()
        await self.async_session.refresh(instance=db_project)

        return db_project

    async def delete_project_by_id(self, project_id: str, owner_account_id: str) -> str:
        db_project = await self.read_project_by_id(project_id=project_id, owner_account_id=owner_account_id)

        stmt = sqlalchemy.delete(table=Project).where(Project.id == db_project.id)
        await self.async_session.execute(statement=stmt)
        await self.async_session.commit()

        return f"Project with id '{project_id}' is successfully deleted!"
