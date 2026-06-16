using GP.Data;

namespace GP.Models.Repositories
{
    public class SupportProgramRepository : IRepository<SupportProgram>
    {
        public AppDbContext db { get; }
        public SupportProgramRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgram.Update(entity);
            db.SaveChanges();
        }

        public void Add(SupportProgram entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.SupportProgram.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgram.Update(entity);
            db.SaveChanges();
        }

        public SupportProgram Find(int Id)
        {
            return db.SupportProgram.SingleOrDefault(x => x.SupportProgramId == Id);
        }

        public void Update(int Id, SupportProgram entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgram.Update(entity);
            db.SaveChanges();
        }

        public List<SupportProgram> ViewAdmin()
        {
            return db.SupportProgram.Where(x => x.IsDelete == false).ToList();
        }

        public List<SupportProgram> ViewClient()
        {
            return db.SupportProgram.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
