using GP.Data;

namespace GP.Models.Repositories
{
    public class AttendanceRepository : IRepository<Attendance>
    {
        public AppDbContext db { get; }
        public AttendanceRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Attendance.Update(entity);
            db.SaveChanges();
        }

        public void Add(Attendance entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Attendance.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Attendance.Update(entity);
            db.SaveChanges();
        }

        public Attendance Find(int Id)
        {
            return db.Attendance.SingleOrDefault(x => x.AttendanceId == Id);
        }

        public void Update(int Id, Attendance entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Attendance.Update(entity);
            db.SaveChanges();
        }

        public List<Attendance> ViewAdmin()
        {
            return db.Attendance.Where(x => x.IsDelete == false).ToList();
        }

        public List<Attendance> ViewClient()
        {
            return db.Attendance.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
