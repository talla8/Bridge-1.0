using GP.Data;

namespace GP.Models.Repositories
{
    public class TargetStudentRepository : IRepository<TargetStudent>
    {
        public AppDbContext db { get; }
        public TargetStudentRepository(AppDbContext _db)
        {
            db = _db;
        }

        void IRepository<TargetStudent>.Add(TargetStudent entity)
        {
            throw new NotImplementedException();
        }

        void IRepository<TargetStudent>.Update(int Id, TargetStudent entity)
        {
            throw new NotImplementedException();
        }

        void IRepository<TargetStudent>.Delete(int Id)
        {
            throw new NotImplementedException();
        }

        void IRepository<TargetStudent>.Active(int Id)
        {
            throw new NotImplementedException();
        }

        List<TargetStudent> IRepository<TargetStudent>.ViewAdmin()
        {
            throw new NotImplementedException();
        }

        List<TargetStudent> IRepository<TargetStudent>.ViewClient()
        {
            throw new NotImplementedException();
        }

        TargetStudent IRepository<TargetStudent>.Find(int Id)
        {
            throw new NotImplementedException();
        }
    }
}
