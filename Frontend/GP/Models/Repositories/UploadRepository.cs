using GP.Data;

namespace GP.Models.Repositories
{
    public class UploadRepository : IRepository<Upload>
    {
        public AppDbContext db { get; }
        public UploadRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Upload.Update(entity);
            db.SaveChanges();
        }

        public void Add(Upload entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Upload.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Upload.Update(entity);
            db.SaveChanges();
        }

        public Upload Find(int Id)
        {
            return db.Upload.SingleOrDefault(x => x.UploadId == Id);
        }

        public void Update(int Id, Upload entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Upload.Update(entity);
            db.SaveChanges();
        }

        public List<Upload> ViewAdmin()
        {
            return db.Upload.Where(x => x.IsDelete == false).ToList();
        }

        public List<Upload> ViewClient()
        {
            return db.Upload.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
