using GP.Data;

namespace GP.Models.Repositories
{
    public class SourceRepository : IRepository<Source>
    {
        public AppDbContext db { get; }
        public SourceRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Source.Update(entity);
            db.SaveChanges();
        }

        public void Add(Source entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Source.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Source.Update(entity);
            db.SaveChanges();
        }

        public Source Find(int Id)
        {
            return db.Source.SingleOrDefault(x => x.SourceId == Id);
        }

        public void Update(int Id, Source entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Source.Update(entity);
            db.SaveChanges();
        }

        public List<Source> ViewAdmin()
        {
            return db.Source.Where(x => x.IsDelete == false).ToList();
        }

        public List<Source> ViewClient()
        {
            return db.Source.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
