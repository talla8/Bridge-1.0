using GP.Data;

namespace GP.Models.Repositories
{
    public class CurriculumItemRepository : IRepository<CurriculumItem>
    {
        public AppDbContext db { get; }
        public CurriculumItemRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.CurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public void Add(CurriculumItem entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.CurriculumItem.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.CurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public CurriculumItem Find(int Id)
        {
            return db.CurriculumItem.SingleOrDefault(x => x.CurriculumItemId == Id);
        }

        public void Update(int Id, CurriculumItem entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.CurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public List<CurriculumItem> ViewAdmin()
        {
            return db.CurriculumItem.Where(x => x.IsDelete == false).ToList();
        }

        public List<CurriculumItem> ViewClient()
        {
            return db.CurriculumItem.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
