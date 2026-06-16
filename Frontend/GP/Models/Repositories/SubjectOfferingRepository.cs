using GP.Data;

namespace GP.Models.Repositories
{
    public class SubjectOfferingRepository : IRepository<SubjectOffering>
    {
        public AppDbContext db { get; }
        public SubjectOfferingRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SubjectOffering.Update(entity);
            db.SaveChanges();
        }

        public void Add(SubjectOffering entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.SubjectOffering.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SubjectOffering.Update(entity);
            db.SaveChanges();
        }

        public SubjectOffering Find(int Id)
        {
            return db.SubjectOffering.SingleOrDefault(x => x.SubjectOfferingId == Id);
        }

        public void Update(int Id, SubjectOffering entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SubjectOffering.Update(entity);
            db.SaveChanges();
        }

        public List<SubjectOffering> ViewAdmin()
        {
            return db.SubjectOffering.Where(x => x.IsDelete == false).ToList();
        }

        public List<SubjectOffering> ViewClient()
        {
            return db.SubjectOffering.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
